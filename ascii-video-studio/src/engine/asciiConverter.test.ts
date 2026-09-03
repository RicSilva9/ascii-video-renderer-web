import { describe, it, expect } from "vitest";
import { pixelToASCII, DEFAULT_CHARSET, CHARSETS } from "./asciiConverter";
import type { ASCIIConfig } from "../types/ascii";

const baseConfig: ASCIIConfig = {
  charset: DEFAULT_CHARSET,
  invertBrightness: false,
  useColor: false,
};

describe("pixelToASCII", () => {
  it("mapeia preto para o primeiro caractere do charset (espaço)", () => {
    const char = pixelToASCII({ r: 0, g: 0, b: 0, a: 255 }, baseConfig);
    expect(char).toBe(" ");
  });

  it("mapeia branco para o último caractere do charset", () => {
    const char = pixelToASCII({ r: 255, g: 255, b: 255, a: 255 }, baseConfig);
    const last = DEFAULT_CHARSET[DEFAULT_CHARSET.length - 1];
    expect(char).toBe(last);
  });

  it("inverte o mapeamento quando invertBrightness = true", () => {
    const normal = pixelToASCII(
      { r: 0, g: 0, b: 0, a: 255 },
      { ...baseConfig, invertBrightness: false },
    );

    const inverted = pixelToASCII(
      { r: 0, g: 0, b: 0, a: 255 },
      { ...baseConfig, invertBrightness: true },
    );

    expect(normal).toBe(" ");
    expect(inverted).toBe(DEFAULT_CHARSET[DEFAULT_CHARSET.length - 1]);
  });

  it("funciona com charset customizado (blocks)", () => {
    const config: ASCIIConfig = {
      charset: CHARSETS.blocks,
      invertBrightness: false,
      useColor: false,
    };

    const black = pixelToASCII({ r: 0, g: 0, b: 0, a: 255 }, config);
    const white = pixelToASCII({ r: 255, g: 255, b: 255, a: 255 }, config);

    expect(black).toBe(CHARSETS.blocks[0]);
    expect(white).toBe(CHARSETS.blocks[CHARSETS.blocks.length - 1]);
  });

  it("retorna exatamente 1 caractere", () => {
    const char = pixelToASCII({ r: 100, g: 150, b: 200, a: 255 }, baseConfig);
    expect(char).toHaveLength(1);
  });
});
