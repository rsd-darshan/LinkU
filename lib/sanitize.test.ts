import { describe, expect, it } from "vitest";
import { sanitizeText, toSlug } from "./sanitize";

describe("sanitizeText", () => {
  it("trims and strips angle brackets", () => {
    expect(sanitizeText("  hello <x>  ")).toBe("hello x");
  });

  it("collapses whitespace", () => {
    expect(sanitizeText("a    b")).toBe("a b");
  });
});

describe("toSlug", () => {
  it("produces URL-safe slugs", () => {
    expect(toSlug("  Hello World!  ")).toBe("hello-world");
  });
});
