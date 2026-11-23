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
/// @notice Holds the reward pool of every task. Each task has exactly 100 slots and
///         every completer can claim 1% of the pool, once. Claims need a signature from
///         the xtask backend proving the user completed the X actions.
///         The owner can only rotate the signer — it can never move users' funds.
contract XTaskEscrow is EIP712, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant SLOTS = 100; // 1% of the pool per claim
    uint256 public constant MAX_META_LENGTH = 1024;
    address public constant NATIVE = address(0);

    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(uint256 taskId,address user,uint256 deadline)");

    struct Task {
        address creator;
        address token; // address(0) = native coin (ETH / BNB / ...)
        uint256 rewardPerUser;
        uint64 endsAt;
        uint16 claimed;
        bool refunded;
        string meta; // JSON: title, description, targetUrl, actions, category
    }

    address public signer;
    uint256 public taskCount;
    mapping(uint256 => Task) private _tasks;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event TaskCreated(uint256 indexed taskId, address indexed creator, address indexed token, uint256 pool, uint64 endsAt);
    event Claimed(uint256 indexed taskId, address indexed user, uint256 amount);
    event Refunded(uint256 indexed taskId, address indexed creator, uint256 amount);
    event SignerUpdated(address signer);

    error InvalidAmount();
    error InvalidEndTime();
    error MetaTooLong();
    error UnknownTask();
    error TaskEnded();
    error TaskFull();
    error AlreadyClaimed();
    error SignatureExpired();
    error InvalidSignature();
    error NotCreator();
    error NotEnded();
    error AlreadyRefunded();
    error ZeroAddress();

    constructor(address initialOwner, address initialSigner) EIP712("xtask.fun", "1") Ownable(initialOwner) {
        if (initialSigner == address(0)) revert ZeroAddress();
        signer = initialSigner;
        emit SignerUpdated(initialSigner);
    }

    // ---------------------------------------------------------------- create

    /// @param amount Total pool. Must be a multiple of 100 so every slot is equal.
    function createTask(address token, uint256 amount, uint64 endsAt, string calldata meta)
        external
        payable
        nonReentrant
        returns (uint256 taskId)
    {
        if (amount == 0 || amount % SLOTS != 0) revert InvalidAmount();
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

        taskId = ++taskCount;
        _tasks[taskId] = Task({
            creator: msg.sender,
            token: token,
            rewardPerUser: amount / SLOTS,
            endsAt: endsAt,
            claimed: 0,
            refunded: false,
            meta: meta
        });

        emit TaskCreated(taskId, msg.sender, token, amount, endsAt);
    }

    // ----------------------------------------------------------------- claim

    function claim(uint256 taskId, uint256 deadline, bytes calldata signature) external nonReentrant {
        Task storage t = _tasks[taskId];
        if (t.creator == address(0)) revert UnknownTask();
        if (block.timestamp > t.endsAt || t.refunded) revert TaskEnded();
        if (t.claimed >= SLOTS) revert TaskFull();
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

    /// @notice After the task ends, the creator gets back the unclaimed slots.
    function refund(uint256 taskId) external nonReentrant {
        Task storage t = _tasks[taskId];
        if (t.creator == address(0)) revert UnknownTask();
        if (msg.sender != t.creator) revert NotCreator();
        if (block.timestamp <= t.endsAt) revert NotEnded();
        if (t.refunded) revert AlreadyRefunded();

        t.refunded = true;
        uint256 amount = t.rewardPerUser * (SLOTS - t.claimed);
        if (amount > 0) _pay(t.token, t.creator, amount);
        emit Refunded(taskId, t.creator, amount);
    }

    // ----------------------------------------------------------------- admin

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
