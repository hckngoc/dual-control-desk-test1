export type RequestCategory =
  | 'Treasury Wire Transfer'
  | 'Production Firewall / IAM Policy Change'
  | 'Emergency Database Key Rotation'
  | string;

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequestStatus =
  | 'PENDING_QUORUM'
  | 'APPROVED'
  | 'EXECUTED'
  | 'REJECTED';

export type AuditEventType =
  | 'CREATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'VIOLATION_ATTEMPT'
  | 'EXECUTED';

export interface CryptographicProof {
  keyThumbprint?: string;
  dpopBound: boolean;
  verificationMode: string;
  policyContract?: string;
  tokenAzp?: string;
  signatureFingerprint?: string;
  payloadDigest?: string;
  timestamp: string;
}

export interface ApproverSignature {
  userId: string;
  userEmail: string;
  name: string;
  role: string;
  approvedAt: string;
  proof: CryptographicProof;
}

export interface SensitiveRequest {
  id: string;
  title: string;
  category: RequestCategory;
  riskLevel: RiskLevel;
  requiresDualControl: boolean;
  requiredQuorum: number;
  requiredRoles: string[];
  rationale: string;
  payload: Record<string, any>;
  makerId: string;
  makerEmail: string;
  makerName: string;
  createdAt: string;
  status: RequestStatus;
  approvals: ApproverSignature[];
  rejection?: {
    userId: string;
    userEmail: string;
    name: string;
    role: string;
    rejectedAt: string;
    reason: string;
    proof: CryptographicProof;
  } | null;
  execution?: {
    executorId: string;
    executorEmail: string;
    executorName: string;
    executedAt: string;
    executionReference: string;
    proof: CryptographicProof;
  } | null;
}

export interface ImmutableAuditEntry {
  index: number;
  at: string;
  type: AuditEventType;
  actor: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
  requestId: string | null;
  detail: string;
  proof: CryptographicProof;
  previousHash: string;
  hash: string;
}
