// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  VerdictGate
 * @notice Pre-action enforcement gate for the Verdict agent security system.
 *
 * The Verdict backend holds the owner key. A token transfer can ONLY be executed
 * by calling this contract as the owner — i.e. after the Verdict engine has issued
 * an ALLOW verdict and a valid, single-use authorization_token has been consumed
 * by the backend. This makes a REJECT a genuine on-chain block, not a cosmetic one.
 *
 * Flow:
 *   1. Deploy with the ERC-20 token address.
 *   2. Fund the contract with tokens (transfer tokens to this contract's address).
 *   3. Backend calls executeTransfer(to, amount) only after passing the full
 *      verdict gate checks (identity → capabilities → policy → token verification).
 *   4. Contract releases tokens and emits TransferExecuted for the audit trail.
 *
 * Security properties:
 *   - Only owner (backend wallet) can call executeTransfer — no other path exists.
 *   - ReentrancyGuard prevents re-entrancy on the transfer call.
 *   - owner can withdraw remaining tokens (for demo resets / top-ups).
 */
contract VerdictGate is Ownable, ReentrancyGuard {
    IERC20 public immutable token;

    // ─── Events ────────────────────────────────────────────────────────────────

    /// @notice Emitted on every successful transfer — forms the on-chain audit trail.
    event TransferExecuted(
        address indexed to,
        uint256 amount,
        address indexed executor,
        uint256 timestamp
    );

    /// @notice Emitted when the owner withdraws tokens from the contract.
    event FundsWithdrawn(address indexed to, uint256 amount);

    // ─── Errors ────────────────────────────────────────────────────────────────

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientContractBalance(uint256 requested, uint256 available);
    error TransferFailed();

    // ─── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _token  Address of the ERC-20 token this gate controls.
     * @param _owner  Initial owner (the Verdict backend wallet).
     */
    constructor(address _token, address _owner) Ownable(_owner) {
        if (_token == address(0)) revert ZeroAddress();
        token = IERC20(_token);
    }

    // ─── Core gate function ────────────────────────────────────────────────────

    /**
     * @notice Execute an agent-authorized token transfer.
     * @dev    Callable only by the owner (Verdict backend wallet).
     *         The backend must have already: verified agent identity, checked
     *         capabilities, evaluated policy, and consumed the single-use
     *         authorization_token before reaching this call.
     *
     * @param to     Recipient address.
     * @param amount Token amount in raw on-chain units (already scaled by decimals).
     */
    function executeTransfer(address to, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        if (to == address(0))  revert ZeroAddress();
        if (amount == 0)       revert ZeroAmount();

        uint256 contractBalance = token.balanceOf(address(this));
        if (contractBalance < amount)  revert InsufficientContractBalance(amount, contractBalance);

        bool success = token.transfer(to, amount);
        if (!success) revert TransferFailed();

        emit TransferExecuted(to, amount, msg.sender, block.timestamp);
    }

    // ─── Admin helpers ─────────────────────────────────────────────────────────

    /**
     * @notice Withdraw tokens from the contract (demo reset / top-up).
     * @param to     Destination address.
     * @param amount Amount to withdraw in raw on-chain units.
     */
    function withdraw(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0)      revert ZeroAmount();

        bool success = token.transfer(to, amount);
        if (!success) revert TransferFailed();

        emit FundsWithdrawn(to, amount);
    }

    /**
     * @notice Returns the current token balance held by this contract.
     */
    function balance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
