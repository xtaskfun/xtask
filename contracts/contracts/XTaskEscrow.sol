// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title xtask.fun escrow
/// @notice Holds the reward pool of every task. The creator picks the reward per person
///         and the number of slots; the pool is reward x slots. Every completer can claim
///         one reward, once. Claims need a signature from the xtask backend.
///         A platform fee (default 5% of the total paid, max 10%) is sent to the fee
///         recipient when a task is created. The owner can rotate the signer and set the
///         fee for future tasks — it can never move funds already in a task's pool.
contract XTaskEscrow is EIP712, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint32 public constant MAX_SLOTS = 10_000;
    uint16 public constant MAX_FEE_BPS = 1_000; // 10%
    uint16 public constant BPS = 10_000;
    uint256 public constant MAX_META_LENGTH = 1024;
    address public constant NATIVE = address(0);

    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(uint256 taskId,address user,uint256 deadline)");

    struct Task {
        address creator;
        address token; // address(0) = native coin (ETH / BNB / ...)
        uint256 rewardPerUser;
        uint64 endsAt;
        uint32 slots;
        uint32 claimed;
        bool refunded;
        string meta; // JSON: title, description, targetUrl, actions, category
    }

    address public signer;
    address public feeRecipient;
    /// @notice Fee as a share of the total the creator pays, in basis points (500 = 5%).
    uint16 public feeBps;
    uint256 public taskCount;
    mapping(uint256 => Task) private _tasks;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        address indexed token,
        uint256 rewardPerUser,
        uint32 slots,
        uint256 fee,
        uint64 endsAt
    );
    event Claimed(uint256 indexed taskId, address indexed user, uint256 amount);
    event Refunded(uint256 indexed taskId, address indexed creator, uint256 amount);
    event SignerUpdated(address signer);
    event FeeUpdated(address recipient, uint16 feeBps);

    error InvalidAmount();
    error InvalidSlots();
    error InvalidEndTime();
    error MetaTooLong();
    error UnknownTask();
    error TaskEnded();
    error TaskFull();
    error AlreadyClaimed();
    error SignatureExpired();
    error InvalidSignature();
    error NotEnded();
    error AlreadyRefunded();
    error ZeroAddress();
    error FeeTooHigh();

    constructor(address initialOwner, address initialSigner) EIP712("xtask.fun", "1") Ownable(initialOwner) {
        if (initialSigner == address(0)) revert ZeroAddress();
        signer = initialSigner;
        emit SignerUpdated(initialSigner);
        feeRecipient = initialOwner;
        feeBps = 500;
        emit FeeUpdated(initialOwner, 500);
    }

    // ------------------------------------------------------------------ quote

    /// @notice What a task costs. The fee is `feeBps` of the total, rounded up:
    ///         e.g. a 9.5 pool at 5% costs 10 (0.5 fee).
    function quote(uint256 rewardPerUser, uint32 slots) public view returns (uint256 pool, uint256 fee, uint256 total) {
        pool = rewardPerUser * slots;
        fee = feeBps == 0 ? 0 : (pool * feeBps + (BPS - feeBps) - 1) / (BPS - feeBps);
        total = pool + fee;
    }

    // ---------------------------------------------------------------- create

    /// @param rewardPerUser What each completer receives, in token base units.
    /// @param slots How many people can claim (1..MAX_SLOTS).
    /// @dev The creator pays `total` from quote(): the pool plus the platform fee.
    function createTask(address token, uint256 rewardPerUser, uint32 slots, uint64 endsAt, string calldata meta)
        external
        payable
        nonReentrant
        returns (uint256 taskId)
    {
        if (rewardPerUser == 0) revert InvalidAmount();
        if (slots == 0 || slots > MAX_SLOTS) revert InvalidSlots();
        (, uint256 fee, uint256 amount) = quote(rewardPerUser, slots);
        if (endsAt <= block.timestamp) revert InvalidEndTime();
        if (bytes(meta).length > MAX_META_LENGTH) revert MetaTooLong();

        if (token == NATIVE) {
            if (msg.value != amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert InvalidAmount();
            // Measure what actually arrived so fee-on-transfer tokens can't underfund the pool.
            uint256 before = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            if (IERC20(token).balanceOf(address(this)) - before != amount) revert InvalidAmount();
        }

        if (fee > 0) _pay(token, feeRecipient, fee);

        taskId = ++taskCount;
        _tasks[taskId] = Task({
            creator: msg.sender,
            token: token,
            rewardPerUser: rewardPerUser,
            endsAt: endsAt,
            slots: slots,
            claimed: 0,
            refunded: false,
            meta: meta
        });

        emit TaskCreated(taskId, msg.sender, token, rewardPerUser, slots, fee, endsAt);
    }

    // ----------------------------------------------------------------- claim

    function claim(uint256 taskId, uint256 deadline, bytes calldata signature) external nonReentrant {
        Task storage t = _tasks[taskId];
        if (t.creator == address(0)) revert UnknownTask();
        if (block.timestamp > t.endsAt || t.refunded) revert TaskEnded();
        if (t.claimed >= t.slots) revert TaskFull();
        if (hasClaimed[taskId][msg.sender]) revert AlreadyClaimed();
        if (block.timestamp > deadline) revert SignatureExpired();

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, taskId, msg.sender, deadline)));
        if (ECDSA.recover(digest, signature) != signer) revert InvalidSignature();

        hasClaimed[taskId][msg.sender] = true;
        t.claimed += 1;

        _pay(t.token, msg.sender, t.rewardPerUser);
        emit Claimed(taskId, msg.sender, t.rewardPerUser);
    }

    // ---------------------------------------------------------------- refund

    /// @notice After the task ends, the unclaimed slots go back to the creator.
    /// @dev Anyone may call this (e.g. an automated keeper) — funds always go to the creator.
    function refund(uint256 taskId) external nonReentrant {
        Task storage t = _tasks[taskId];
        if (t.creator == address(0)) revert UnknownTask();
        if (block.timestamp <= t.endsAt) revert NotEnded();
        if (t.refunded) revert AlreadyRefunded();

        t.refunded = true;
        uint256 amount = t.rewardPerUser * (t.slots - t.claimed);
        if (amount > 0) _pay(t.token, t.creator, amount);
        emit Refunded(taskId, t.creator, amount);
    }

    // ----------------------------------------------------------------- admin

    /// @notice Applies to tasks created afterwards. Capped at MAX_FEE_BPS.
    function setFee(address recipient, uint16 newFeeBps) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeRecipient = recipient;
        feeBps = newFeeBps;
        emit FeeUpdated(recipient, newFeeBps);
    }

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    // ------------------------------------------------------------------ view

    function getTask(uint256 taskId) external view returns (Task memory) {
        if (_tasks[taskId].creator == address(0)) revert UnknownTask();
        return _tasks[taskId];
    }

    /// @notice Newest first. Use for the task list page.
    function getTasks(uint256 offset, uint256 limit) external view returns (uint256[] memory ids, Task[] memory list) {
        uint256 total = taskCount;
        if (offset >= total) return (ids, list);
        uint256 n = total - offset < limit ? total - offset : limit;
        ids = new uint256[](n);
        list = new Task[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 id = total - offset - i;
            ids[i] = id;
            list[i] = _tasks[id];
        }
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // -------------------------------------------------------------- internal

    function _pay(address token, address to, uint256 amount) private {
        if (token == NATIVE) Address.sendValue(payable(to), amount);
        else IERC20(token).safeTransfer(to, amount);
    }
}
