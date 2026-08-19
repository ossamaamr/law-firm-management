import { describe, expect, it } from "vitest";
import { escapeCsvCell } from "./activity.service";

describe("activity CSV safety", () => {
  it.each(["=SUM(1,1)", "+cmd", "-cmd", "@cmd", "  =formula"]) (
    "neutralizes spreadsheet formulas: %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`"'${value.replace(/"/g, '""')}"`);
    },
  );

  it("escapes quotes and preserves RFC line breaks", () => {
    expect(escapeCsvCell('client "confidential"\r\nrecord')).toBe('"client ""confidential""\r\nrecord"');
  });
});
