import type { ASCIIConfig, PixelColor } from "../types/ascii";
import { calculateLuminance } from "./luminance";

/**
 * Charset padrão: do espaço (vazio) ao @ (denso).
 * 10 níveis de intensidade.
 */
export const DEFAULT_CHARSET = " .:-=+*#%@";

/**
 * Converte um pixel em um caractere ASCII baseado na sua luminância.
 */
export function pixelToASCII(pixel: PixelColor, config: ASCIIConfig): string {
  const luminance = calculateLuminance(pixel);
  const maxIndex = config.charset.length - 1;

  // Mapeia luminância (0-255) para índice do charset (0-maxIndex)
  let index = Math.floor((luminance * maxIndex) / 255);

  // No modo escuro (fundo preto), pixels claros precisam de
  // caracteres densos, então invertemos o índice
  if (config.invertBrightness) {
    index = maxIndex - index;
  }

  return config.charset[index];
}
