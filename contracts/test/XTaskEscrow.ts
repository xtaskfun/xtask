import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress, parseEther, parseUnits, zeroAddress, type Address } from "viem";

const DAY = 86_400n;

async function deploy() {
  const [owner, signer, creator, alice, bob, eve] = await hre.viem.getWalletClients();
  const escrow = await hre.viem.deployContract("XTaskEscrow", [owner.account.address, signer.account.address]);
  const token = await hre.viem.deployContract("MockERC20", []);
  const publicClient = await hre.viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  await token.write.mint([creator.account.address, parseUnits("1000", 6)]);
  await token.write.approve([escrow.address, parseUnits("1000", 6)], { account: creator.account });

  const sign = (taskId: bigint, user: Address, deadline: bigint, by = signer) =>
    by.signTypedData({
      account: by.account,
      domain: { name: "xtask.fun", version: "1", chainId, verifyingContract: escrow.address },
      types: { Claim: [{ name: "taskId", type: "uint256" }, { name: "user", type: "address" }, { name: "deadline", type: "uint256" }] },
      primaryType: "Claim",
      message: { taskId, user, deadline },
    });

  const as = async (wallet: typeof alice) =>
    hre.viem.getContractAt("XTaskEscrow", escrow.address, { client: { wallet } });

  return { escrow, token, owner, signer, creator, alice, bob, eve, publicClient, sign, as };
}

async function withTask() {
  const f = await deploy();
  const endsAt = BigInt(await time.latest()) + 7n * DAY;
  const escrowC = await f.as(f.creator);
  await escrowC.write.createTask([f.token.address, parseUnits("100", 6), endsAt, '{"title":"t"}']);
  return { ...f, endsAt };
}

describe("XTaskEscrow", () => {
  it("creates an ERC20 task: pool held in escrow, reward = 1%", async () => {
    const { escrow, token, endsAt } = await loadFixture(withTask);
    expect(await token.read.balanceOf([escrow.address])).to.equal(parseUnits("100", 6));
    const t = await escrow.read.getTask([1n]);
    expect(t.rewardPerUser).to.equal(parseUnits("1", 6));
    expect(t.endsAt).to.equal(endsAt);
    expect(t.claimed).to.equal(0);
  });

  it("rejects pools that are not a multiple of 100", async () => {
    const { token, creator, as } = await loadFixture(deploy);
    const c = await as(creator);
    const ends = BigInt(await time.latest()) + DAY;
    await expect(c.write.createTask([token.address, 150n, ends, ""])).to.be.rejectedWith("InvalidAmount");
  });

  it("lets a verified user claim exactly once", async () => {
    const { token, alice, sign, as } = await loadFixture(withTask);
    const deadline = BigInt(await time.latest()) + 600n;
    const sig = await sign(1n, alice.account.address, deadline);
    const a = await as(alice);
    await a.write.claim([1n, deadline, sig]);
    expect(await token.read.balanceOf([alice.account.address])).to.equal(parseUnits("1", 6));
    await expect(a.write.claim([1n, deadline, sig])).to.be.rejectedWith("AlreadyClaimed");
  });

  it("rejects a signature made for someone else", async () => {
    const { alice, eve, sign, as } = await loadFixture(withTask);
    const deadline = BigInt(await time.latest()) + 600n;
    const sigForAlice = await sign(1n, alice.account.address, deadline);
    const e = await as(eve);
    await expect(e.write.claim([1n, deadline, sigForAlice])).to.be.rejectedWith("InvalidSignature");
  });

  it("rejects signatures not from the backend signer", async () => {
    const { eve, sign, as } = await loadFixture(withTask);
    const deadline = BigInt(await time.latest()) + 600n;
    const forged = await sign(1n, eve.account.address, deadline, eve);
    await expect((await as(eve)).write.claim([1n, deadline, forged])).to.be.rejectedWith("InvalidSignature");
  });

  it("rejects expired signatures and claims after the task ends", async () => {
    const { alice, sign, as, endsAt } = await loadFixture(withTask);
    const a = await as(alice);
    const old = BigInt(await time.latest()) + 60n;
    const sig = await sign(1n, alice.account.address, old);
    await time.increase(120);
    await expect(a.write.claim([1n, old, sig])).to.be.rejectedWith("SignatureExpired");

    await time.increaseTo(endsAt + 1n);
    const later = endsAt + 600n;
    const sig2 = await sign(1n, alice.account.address, later);
    await expect(a.write.claim([1n, later, sig2])).to.be.rejectedWith("TaskEnded");
  });

  it("stops at 100 claims (1% each)", async () => {
    const { escrow, token, sign, creator, as } = await loadFixture(deploy);
    const ends = BigInt(await time.latest()) + DAY;
    await (await as(creator)).write.createTask([token.address, 100n, ends, ""]); // 1 unit per slot
    const { privateKeyToAccount, generatePrivateKey } = await import("viem/accounts");
    for (let i = 0; i <= 100; i++) {
      const acct = privateKeyToAccount(generatePrivateKey());
      await hre.network.provider.request({ method: "hardhat_setBalance", params: [acct.address, "0xDE0B6B3A7640000"] });
      const w = await hre.viem.getWalletClient(acct.address, { account: acct });
      const e = await hre.viem.getContractAt("XTaskEscrow", escrow.address, { client: { wallet: w } });
      const sig = await sign(1n, acct.address, ends);
      if (i < 100) await e.write.claim([1n, ends, sig]);
      else await expect(e.write.claim([1n, ends, sig])).to.be.rejectedWith("TaskFull");
    }
    expect(await token.read.balanceOf([escrow.address])).to.equal(0n);
  });

  it("refunds unclaimed slots to the creator after the end, only once", async () => {
    const { token, escrow, alice, creator, sign, as, endsAt } = await loadFixture(withTask);
    const deadline = BigInt(await time.latest()) + 600n;
    await (await as(alice)).write.claim([1n, deadline, await sign(1n, alice.account.address, deadline)]);

    const c = await as(creator);
    await expect(c.write.refund([1n])).to.be.rejectedWith("NotEnded");
    await time.increaseTo(endsAt + 1n);
    await expect((await as(alice)).write.refund([1n])).to.be.rejectedWith("NotCreator");

    const before = await token.read.balanceOf([creator.account.address]);
    await c.write.refund([1n]);
    expect((await token.read.balanceOf([creator.account.address])) - before).to.equal(parseUnits("99", 6));
    expect(await token.read.balanceOf([escrow.address])).to.equal(0n);
    await expect(c.write.refund([1n])).to.be.rejectedWith("AlreadyRefunded");
  });

  it("supports native ETH pools", async () => {
    const { escrow, creator, alice, sign, as, publicClient } = await loadFixture(deploy);
    const ends = BigInt(await time.latest()) + DAY;
    await (await as(creator)).write.createTask([zeroAddress, parseEther("1"), ends, ""], { value: parseEther("1") });
    expect(await publicClient.getBalance({ address: escrow.address })).to.equal(parseEther("1"));

    const deadline = ends;
    const before = await publicClient.getBalance({ address: alice.account.address });
    const hash = await (await as(alice)).write.claim([1n, deadline, await sign(1n, alice.account.address, deadline)]);
    const r = await publicClient.waitForTransactionReceipt({ hash });
    const after = await publicClient.getBalance({ address: alice.account.address });
    expect(after - before + r.gasUsed * r.effectiveGasPrice).to.equal(parseEther("0.01"));
  });

  it("only the owner can rotate the signer", async () => {
    const { escrow, eve, as } = await loadFixture(deploy);
    await expect((await as(eve)).write.setSigner([eve.account.address])).to.be.rejectedWith("OwnableUnauthorizedAccount");
    await escrow.write.setSigner([getAddress(eve.account.address)]);
    expect(await escrow.read.signer()).to.equal(getAddress(eve.account.address));
  });

  it("lists tasks newest first", async () => {
    const { token, creator, as } = await loadFixture(deploy);
    const c = await as(creator);
    const ends = BigInt(await time.latest()) + DAY;
    for (let i = 0; i < 3; i++) await c.write.createTask([token.address, 100n, ends, `{"i":${i}}`]);
    const [ids, list] = await c.read.getTasks([0n, 10n]);
    expect(ids).to.deep.equal([3n, 2n, 1n]);
    expect(list[0].meta).to.equal('{"i":2}');
  });
});
