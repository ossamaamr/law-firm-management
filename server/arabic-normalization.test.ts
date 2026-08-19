import { describe, expect, it } from "vitest";
import { normalizeArabicText } from "./arabic-normalization";

describe("Arabic normalization", () => {
  it("normalizes common Arabic variants and diacritics for comparison", () => {
    expect(normalizeArabicText("إِدارةُ القَضِيّةِ")).toBe("اداره القضيه");
    expect(normalizeArabicText("  مِرْصاد  ")).toBe("مرصاد");
  });
});
