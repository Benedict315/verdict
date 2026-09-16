import { expect } from 'chai';
import { ethers } from 'hardhat';
import { VerdictGate, ERC20Mock } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

/**
 * VerdictGate.sol test suite
 *
 * Uses Hardhat's in-memory EVM + a minimal ERC20Mock (deployed fresh per test).
 * No real network or funds required.
 */
describe('VerdictGate', () => {
  let gate: VerdictGate;
  let token: ERC20Mock;
  let owner: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const INITIAL_SUPPLY = ethers.parseUnits('10000', 18);
  const GATE_FUND      = ethers.parseUnits('1000',  18);
  const TRANSFER_AMT   = ethers.parseUnits('100',   18);

  beforeEach(async () => {
    [owner, recipient, attacker] = await ethers.getSigners();

    // Deploy a minimal ERC20 mock
    const TokenFactory = await ethers.getContractFactory('ERC20Mock');
    token = await TokenFactory.deploy('TestToken', 'TTK', owner.address, INITIAL_SUPPLY);

    // Deploy VerdictGate with the token and owner
    const GateFactory = await ethers.getContractFactory('VerdictGate');
    gate = await GateFactory.deploy(await token.getAddress(), owner.address);

    // Fund the gate contract with tokens so it has a balance to send
    await token.transfer(await gate.getAddress(), GATE_FUND);
  });

  // ─── Deployment ─────────────────────────────────────────────────────────────

  describe('Deployment', () => {
    it('sets the correct token address', async () => {
      expect(await gate.token()).to.equal(await token.getAddress());
    });

    it('sets the correct owner', async () => {
      expect(await gate.owner()).to.equal(owner.address);
    });

    it('reflects the funded token balance', async () => {
      expect(await gate.balance()).to.equal(GATE_FUND);
    });

    it('reverts if token address is zero', async () => {
      const GateFactory = await ethers.getContractFactory('VerdictGate');
      await expect(
        GateFactory.deploy(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(gate, 'ZeroAddress');
    });
  });

  // ─── executeTransfer — happy path ───────────────────────────────────────────

  describe('executeTransfer', () => {
    it('transfers tokens to recipient', async () => {
      const before = await token.balanceOf(recipient.address);
      await gate.executeTransfer(recipient.address, TRANSFER_AMT);
      const after = await token.balanceOf(recipient.address);
      expect(after - before).to.equal(TRANSFER_AMT);
    });

    it('reduces the gate contract balance', async () => {
      await gate.executeTransfer(recipient.address, TRANSFER_AMT);
      expect(await gate.balance()).to.equal(GATE_FUND - TRANSFER_AMT);
    });

    it('emits TransferExecuted with correct args', async () => {
      await expect(gate.executeTransfer(recipient.address, TRANSFER_AMT))
        .to.emit(gate, 'TransferExecuted')
        .withArgs(recipient.address, TRANSFER_AMT, owner.address, await latestTimestamp());
    });
  });

  // ─── executeTransfer — access control (the critical security tests) ─────────

  describe('executeTransfer — access control', () => {
    it('REJECTS call from non-owner (attacker)', async () => {
      await expect(
        gate.connect(attacker).executeTransfer(attacker.address, TRANSFER_AMT)
      ).to.be.revertedWithCustomError(gate, 'OwnableUnauthorizedAccount')
        .withArgs(attacker.address);
    });

    it('REJECTS call from recipient (not owner)', async () => {
      await expect(
        gate.connect(recipient).executeTransfer(recipient.address, TRANSFER_AMT)
      ).to.be.revertedWithCustomError(gate, 'OwnableUnauthorizedAccount');
    });

    it('REJECTS transfer to zero address', async () => {
      await expect(
        gate.executeTransfer(ethers.ZeroAddress, TRANSFER_AMT)
      ).to.be.revertedWithCustomError(gate, 'ZeroAddress');
    });

    it('REJECTS zero amount', async () => {
      await expect(
        gate.executeTransfer(recipient.address, 0n)
      ).to.be.revertedWithCustomError(gate, 'ZeroAmount');
    });

    it('REJECTS transfer when gate is underfunded', async () => {
      const tooMuch = GATE_FUND + 1n;
      await expect(
        gate.executeTransfer(recipient.address, tooMuch)
      ).to.be.revertedWithCustomError(gate, 'InsufficientContractBalance');
    });
  });

  // ─── withdraw ────────────────────────────────────────────────────────────────

  describe('withdraw', () => {
    it('allows owner to withdraw tokens', async () => {
      const before = await token.balanceOf(owner.address);
      await gate.withdraw(owner.address, TRANSFER_AMT);
      expect(await token.balanceOf(owner.address)).to.equal(before + TRANSFER_AMT);
    });

    it('emits FundsWithdrawn', async () => {
      await expect(gate.withdraw(owner.address, TRANSFER_AMT))
        .to.emit(gate, 'FundsWithdrawn')
        .withArgs(owner.address, TRANSFER_AMT);
    });

    it('REJECTS withdraw from non-owner', async () => {
      await expect(
        gate.connect(attacker).withdraw(attacker.address, TRANSFER_AMT)
      ).to.be.revertedWithCustomError(gate, 'OwnableUnauthorizedAccount');
    });

    it('REJECTS withdraw to zero address', async () => {
      await expect(
        gate.withdraw(ethers.ZeroAddress, TRANSFER_AMT)
      ).to.be.revertedWithCustomError(gate, 'ZeroAddress');
    });
  });

  // ─── ownership transfer ───────────────────────────────────────────────────

  describe('ownership', () => {
    it('allows owner to transfer ownership', async () => {
      await gate.transferOwnership(recipient.address);
      expect(await gate.owner()).to.equal(recipient.address);
    });

    it('new owner can call executeTransfer; old owner cannot', async () => {
      await gate.transferOwnership(recipient.address);

      // New owner succeeds
      await gate.connect(recipient).executeTransfer(attacker.address, TRANSFER_AMT);

      // Old owner is now rejected
      await expect(
        gate.executeTransfer(attacker.address, TRANSFER_AMT)
      ).to.be.revertedWithCustomError(gate, 'OwnableUnauthorizedAccount');
    });
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function latestTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock('latest');
  return block!.timestamp;
}
