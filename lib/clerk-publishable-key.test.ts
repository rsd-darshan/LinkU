import { describe, expect, it } from "vitest";
import { isUsableClerkPublishableKey } from "./clerk-publishable-key";

describe("isUsableClerkPublishableKey", () => {
  it("rejects empty and malformed values", () => {
    expect(isUsableClerkPublishableKey(undefined)).toBe(false);
    expect(isUsableClerkPublishableKey("")).toBe(false);
    expect(isUsableClerkPublishableKey("pk_test_short")).toBe(false);
    expect(isUsableClerkPublishableKey("pk_live_short")).toBe(false);
  });

  it("accepts long pk_test / pk_live shaped keys", () => {
    const fake = "pk_test_" + "a".repeat(45);
    expect(isUsableClerkPublishableKey(fake)).toBe(true);
    const live = "pk_live_" + "b".repeat(45);
    expect(isUsableClerkPublishableKey(live)).toBe(true);
  });
});
