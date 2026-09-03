import type { ASCIIConfig } from "../types/ascii";
import { pixelToASCII } from "./asciiConverter";

/**
 * Converte os dados brutos de uma imagem (ImageData do Canvas)
 * em uma string ASCII, linha por linha.
 *
 * @param imageData - Dados retornados por ctx.getImageData()
 * @param config - Configuração do charset e inversão
 * @returns String com quebras de linha, pronta para exibir em <pre>
 */
export function imageDataToASCII(
  imageData: ImageData,
  config: ASCIIConfig,
): string {
  const { data, width, height } = imageData;
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";

    for (let x = 0; x < width; x++) {
      // Fórmula row-major: (y * width + x) * 4
      const index = (y * width + x) * 4;

      const pixel = {
        r: data[index], // Red
        g: data[index + 1], // Green
        b: data[index + 2], // Blue
        a: data[index + 3], // Alpha
      };

      line += pixelToASCII(pixel, config);
    }

    lines.push(line);
  }

  return lines.join("\n");
}
