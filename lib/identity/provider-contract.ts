/**
 * Future provider contract for DealCapital Identity.
 *
 * This module performs no verification and does not connect to RENIEC/SBS.
 * Real adapters require an authorized legal basis and secured backend.
 */
export type IdentityCapability = "identity" | "business" | "credit";
export type CapabilityState = "not_configured" | "pending_authorization" | "available";
export type VerificationState = "consent_required" | "pending_provider" | "manual_review" | "approved" | "rejected" | "expired";

export type IdentityProviderStatus = {
  capability: IdentityCapability;
  state: CapabilityState;
  provider: string | null;
  userInputEnabled: boolean;
};

export type IdentityProviderOutcome = {
  requestId: string;
  state: Exclude<VerificationState,"consent_required">;
  evidenceReference?: string;
  evaluatedAt: string;
};

export interface AuthorizedIdentityProvider {
  readonly capability: IdentityCapability;
  initiate(input: {
    subjectId: string;
    consentRecordId: string;
    returnUrl: string;
  }): Promise<{ requestId: string; redirectUrl?: string }>;
  getStatus(requestId: string): Promise<IdentityProviderOutcome>;
}
