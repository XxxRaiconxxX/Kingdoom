import { describe, expect, it } from "vitest";
import { shouldOfferFirstAccess, shouldOfferManualApproval } from "./PlayerProfilePanel";

describe("secure access action", () => {
  it("offers first access for WhatsApp-linked players without auth", () => {
    expect(shouldOfferFirstAccess({ phone: "+34123456789", authUserId: null })).toBe(true);
    expect(shouldOfferFirstAccess({ phone: "+34123456789", authUserId: "auth-user" })).toBe(false);
    expect(shouldOfferFirstAccess({ phone: null, authUserId: null })).toBe(false);
  });

  it("keeps login for existing auth and manual approval only for profiles without WhatsApp", () => {
    expect(shouldOfferFirstAccess({ phone: "+34123456789", authUserId: null })).toBe(true);
    expect(shouldOfferFirstAccess({ phone: "+34123456789", authUserId: "auth-user" })).toBe(false);
    expect(shouldOfferManualApproval({ phone: null, authUserId: null })).toBe(true);
    expect(shouldOfferManualApproval({ phone: "+34123456789", authUserId: null })).toBe(false);
  });
});
