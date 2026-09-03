import type { ASCIIConfig, ASCIIFrame, ASCIICell } from "../types/ascii";
import { pixelToASCII } from "./asciiConverter";

/**
 * Processa uma ImageData do Canvas e gera uma estrutura ASCIIFrame
 * contendo cada caractere e sua respectiva cor RGB.
 */
export function processImageDataToFrame(
  imageData: ImageData,
  config: ASCIIConfig,
): ASCIIFrame {
  const { data, width, height } = imageData;
  const cells: ASCIICell[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      const char = pixelToASCII({ r, g, b, a }, config);

      cells.push({ char, r, g, b });
    }
  }

  return { cells, width, height };
}
