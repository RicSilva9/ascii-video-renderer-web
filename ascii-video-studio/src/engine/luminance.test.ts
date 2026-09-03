import { describe, it, expect } from "vitest";
import { calculateLuminance } from "./luminance";

describe("calculateLuminance", () => {
  it("retorna 0 para preto absoluto", () => {
    const result = calculateLuminance({ r: 0, g: 0, b: 0, a: 255 });
    expect(result).toBe(0);
  });

  it("retorna 255 para branco absoluto", () => {
    const result = calculateLuminance({ r: 255, g: 255, b: 255, a: 255 });
    expect(result).toBe(255);
  });

  it("dá mais peso ao verde do que ao azul (BT.601)", () => {
    const green = calculateLuminance({ r: 0, g: 255, b: 0, a: 255 });
    const blue = calculateLuminance({ r: 0, g: 0, b: 255, a: 255 });

    // 0.587*255 > 0.114*255
    expect(green).toBeGreaterThan(blue);
  });

  it("calcula cinza médio corretamente", () => {
    // 0.299*128 + 0.587*128 + 0.114*128 = 128
    const result = calculateLuminance({ r: 128, g: 128, b: 128, a: 255 });
    expect(result).toBeCloseTo(128, 5);
  });
});
