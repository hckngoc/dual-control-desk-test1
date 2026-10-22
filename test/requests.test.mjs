import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RequestDesk,
  DualControlError,
  CATEGORY_TREASURY,
  CATEGORY_FIREWALL_IAM,
  CATEGORY_KEY_ROTATION,
} from '../core/requests-engine.mjs';

const makerAlice = {
  id: 'alice-maker',
  email: 'alice@rmit.internal',
  name: 'Alice Maker',
  roles: ['requester'],
  dpopThumbprint: 'thumbprint-alice-12345',
};

const checkerBob = {
  id: 'bob-checker',
  email: 'bob@rmit.internal',
  name: 'Bob Finance Checker',
  roles: ['finance-approver'],
  dpopThumbprint: 'thumbprint-bob-67890',
};

const checkerCarol = {
  id: 'carol-checker',
  email: 'carol@rmit.internal',
  name: 'Carol Department Checker',
  roles: ['department-approver'],
  dpopThumbprint: 'thumbprint-carol-54321',
};

const executorFrank = {
  id: 'frank-treasury',
  email: 'frank@rmit.internal',
  name: 'Frank Executor',
  roles: ['treasury-executor'],
  dpopThumbprint: 'thumbprint-frank-99999',
};

test('Requirement 1: Category risk thresholds & Dual Control assignment', () => {
  const desk = new RequestDesk();

  // 1a. Treasury Wire Transfer <= 10,000 -> Single control
  const tLow = desk.create(makerAlice, {
    title: 'Vendor Invoice Payment',
    category: CATEGORY_TREASURY,
    payload: { amount: 5000, recipient: 'Acme Corp' },
  });
  assert.equal(tLow.requiresDualControl, false);
  assert.equal(tLow.requiredQuorum, 1);

  // 1b. Treasury Wire Transfer > 10,000 -> Dual Control Quorum
  const tHigh = desk.create(makerAlice, {
    title: 'Cross-Border Supply Chain Transfer',
    category: CATEGORY_TREASURY,
    payload: { amount: 75000, recipient: 'Global Logistics AG' },
  });
  assert.equal(tHigh.requiresDualControl, true);
  assert.equal(tHigh.requiredQuorum, 2);

  // 1c. Production Firewall / IAM Policy Change -> Always Dual Control
  const firewallReq = desk.create(makerAlice, {
    title: 'Open Port 443 to DMZ Cluster',
    category: CATEGORY_FIREWALL_IAM,
    payload: { targetVPC: 'vpc-prod-01', port: 443 },
  });
  assert.equal(firewallReq.requiresDualControl, true);
  assert.equal(firewallReq.riskLevel, 'HIGH');
  assert.equal(firewallReq.requiredQuorum, 2);

  // 1d. Emergency Database Key Rotation -> Always Dual Control
  const keyReq = desk.create(makerAlice, {
    title: 'Rotate Master AES-256 HSM Encryption Key',
    category: CATEGORY_KEY_ROTATION,
    payload: { keyAlias: 'hsm/master/database' },
  });
  assert.equal(keyReq.requiresDualControl, true);
  assert.equal(keyReq.riskLevel, 'CRITICAL');
  assert.equal(keyReq.requiredQuorum, 2);
});

test('Requirement 2: Maker initiates request with recorded metadata and PENDING_QUORUM status', () => {
  const desk = new RequestDesk();
  const req = desk.create(makerAlice, {
    title: 'Emergency Database Key Rotation',
    category: CATEGORY_KEY_ROTATION,
    payload: { reason: 'Annual HSM cycle' },
  });

  assert.equal(req.status, 'PENDING_QUORUM');
  assert.equal(req.makerId, 'alice-maker');
  assert.equal(req.makerEmail, 'alice@rmit.internal');
  assert.equal(req.makerName, 'Alice Maker');
  assert.ok(req.createdAt);
  assert.deepEqual(req.payload, { reason: 'Annual HSM cycle' });
});

test('Requirement 2: Strict Separation of Duties blocks Maker from self-approving', () => {
  const desk = new RequestDesk();
  const req = desk.create(makerAlice, {
    title: 'Treasury Wire Transfer',
    category: CATEGORY_TREASURY,
    payload: { amount: 50000 },
  });

  // Maker attempts to approve own request
  assert.throws(
    () => desk.approve(makerAlice, req.id),
    (err) => {
      assert.ok(err instanceof DualControlError);
      assert.equal(err.status, 403);
      assert.equal(err.message, 'Dual-Control Violation: Initiator cannot approve their own request.');
      return true;
    }
  );

  // Request remains in PENDING_QUORUM
  assert.equal(desk.one(req.id).status, 'PENDING_QUORUM');

  // Verify VIOLATION_ATTEMPT logged in audit trail
  const violationEvent = desk.auditLog.find((e) => e.type === 'VIOLATION_ATTEMPT');
  assert.ok(violationEvent);
  assert.equal(violationEvent.actor.id, 'alice-maker');
  assert.equal(violationEvent.requestId, req.id);
});

test('Requirement 2: Valid Checker approves, attaches cryptographic proof, transitions to APPROVED & EXECUTED', () => {
  const desk = new RequestDesk();

  // Test single-control case ($5,000)
  const reqLow = desk.create(makerAlice, {
    title: 'Office Supplies',
    category: CATEGORY_TREASURY,
    payload: { amount: 5000 },
  });

  const updatedLow = desk.approve(checkerBob, reqLow.id, { role: 'finance-approver' });
  assert.equal(updatedLow.status, 'EXECUTED');
  assert.equal(updatedLow.approvals.length, 1);

  const sig = updatedLow.approvals[0];
  assert.equal(sig.userId, 'bob-checker');
  assert.equal(sig.role, 'finance-approver');
  assert.ok(sig.proof.keyThumbprint);
  assert.ok(sig.proof.signatureFingerprint);
  assert.equal(sig.proof.verificationMode, 'VERIFIED_EMBEDDED_JWKS');

  // Test dual-control case ($25,000)
  const reqHigh = desk.create(makerAlice, {
    title: 'High-Value Wire Transfer',
    category: CATEGORY_TREASURY,
    payload: { amount: 25000 },
  });

  // First checker signs
  const step1 = desk.approve(checkerBob, reqHigh.id, { role: 'finance-approver' });
  assert.equal(step1.status, 'PENDING_QUORUM'); // Needs 2-of-2
  assert.equal(step1.approvals.length, 1);

  // Same checker cannot sign second step
  assert.throws(
    () => desk.approve(checkerBob, reqHigh.id, { role: 'department-approver' }),
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.message, 'Dual-Control Violation: One identity cannot approve twice in a quorum.');
      return true;
    }
  );

  // Second checker signs -> quorum complete -> transitions to APPROVED & EXECUTED
  const step2 = desk.approve(checkerCarol, reqHigh.id, { role: 'department-approver' });
  assert.equal(step2.status, 'EXECUTED');
  assert.equal(step2.approvals.length, 2);
  assert.ok(step2.execution.executionReference);
});

test('Requirement 2 & 3: Checker rejects request with reason and proof', () => {
  const desk = new RequestDesk();
  const req = desk.create(makerAlice, {
    title: 'Suspicious Port Change',
    category: CATEGORY_FIREWALL_IAM,
    payload: { port: 22 },
  });

  // Maker cannot self-reject as checker
  assert.throws(
    () => desk.reject(makerAlice, req.id, 'Self reject'),
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.message, 'Dual-Control Violation: Initiator cannot review or reject their own request.');
      return true;
    }
  );

  // Checker rejects
  const rejected = desk.reject(checkerBob, req.id, 'Unjustified SSH exposure to public subnet');
  assert.equal(rejected.status, 'REJECTED');
  assert.equal(rejected.rejection.reason, 'Unjustified SSH exposure to public subnet');
  assert.ok(rejected.rejection.proof.signatureFingerprint);

  // Cannot approve a rejected request
  assert.throws(() => desk.approve(checkerCarol, req.id), DualControlError);
});

test('Requirement 3: Tamper-Evident Audit Trail records all state changes with cryptographic chain integrity', () => {
  const desk = new RequestDesk();

  // Create
  const req = desk.create(makerAlice, {
    title: 'Database Key Rotation',
    category: CATEGORY_KEY_ROTATION,
    payload: { hsmCluster: 'eu-west-1' },
  });

  // Violation attempt
  try { desk.approve(makerAlice, req.id); } catch {}

  // Approve 1
  desk.approve(checkerBob, req.id);

  // Approve 2
  desk.approve(checkerCarol, req.id);

  const log = desk.auditLog;
  const types = log.map((e) => e.type);

  // All mandated event types present
  assert.ok(types.includes('CREATED'));
  assert.ok(types.includes('VIOLATION_ATTEMPT'));
  assert.ok(types.includes('APPROVED'));
  assert.ok(types.includes('EXECUTED'));

  // Verify SHA-256 chain integrity
  const integrity = desk.verifyAuditIntegrity();
  assert.equal(integrity.valid, true);
  assert.ok(integrity.totalEntries >= 4);
});
