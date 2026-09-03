import { describe, it, expect } from "vitest";
import { processImageDataToFrame } from "./processFrame";
import { DEFAULT_CHARSET } from "./asciiConverter";
import type { ASCIIConfig } from "../types/ascii";

/**
 * Cria um ImageData fake em memória (sem precisar de arquivo real).
 * 2x2 pixels:
 * [ preto, branco ]
 * [ vermelho, verde ]
 */
function createFakeImageData(): ImageData {
  const width = 2;
  const height = 2;
  const data = new Uint8ClampedArray([
    // y0x0 preto
    0, 0, 0, 255,
    // y0x1 branco
    255, 255, 255, 255,
    // y1x0 vermelho
    255, 0, 0, 255,
    // y1x1 verde
    0, 255, 0, 255,
  ]);

  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

describe("processImageDataToFrame", () => {
  const config: ASCIIConfig = {
    charset: DEFAULT_CHARSET,
    invertBrightness: false,
    useColor: true,
  };

  it("gera width/height corretos e 4 células para imagem 2x2", () => {
    const imageData = createFakeImageData();
    const frame = processImageDataToFrame(imageData, config);

    expect(frame.width).toBe(2);
    expect(frame.height).toBe(2);
    expect(frame.cells).toHaveLength(4);
  });

  it("preserva RGB original em cada célula", () => {
    const imageData = createFakeImageData();
    const frame = processImageDataToFrame(imageData, config);

    expect(frame.cells[0]).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(frame.cells[1]).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(frame.cells[2]).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(frame.cells[3]).toMatchObject({ r: 0, g: 255, b: 0 });
  });

  it("mapeia preto e branco para extremos do charset", () => {
    const imageData = createFakeImageData();
    const frame = processImageDataToFrame(imageData, config);

    expect(frame.cells[0].char).toBe(" ");
    expect(frame.cells[1].char).toBe(
      DEFAULT_CHARSET[DEFAULT_CHARSET.length - 1],
    );
  });
});
