import { NextResponse } from "next/server";
import type { IdentityProviderStatus } from "../../../../lib/identity/provider-contract";

/** Non-sensitive readiness endpoint; does not accept PII or verify identity. */
export const dynamic = "force-dynamic";

export function GET() {
  const capabilities: IdentityProviderStatus[] = [
    { capability: "identity", state: "not_configured", provider: null, userInputEnabled: false },
    { capability: "business", state: "not_configured", provider: null, userInputEnabled: false },
    { capability: "credit", state: "not_configured", provider: null, userInputEnabled: false },
  ];
  return NextResponse.json({
    service: "DealCapital Identity",
    status: "preparation",
    officialVerificationAvailable: false,
    acceptsIdentityDocuments: false,
    acceptsCreditReports: false,
    capabilities,
    notice: "No hay integración autorizada con RENIEC, SBS ni proveedores de información crediticia.",
  }, { status: 200, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
