import type { ASCIIConfig, PixelColor } from "../types/ascii";
import { calculateLuminance } from "./luminance";

/**
 * Charsets pré-configurados para diferentes estilos visuais
 */
export const CHARSETS = {
  /** Padrão: boa gradação de cinza de 10 níveis */
  standard: " .:-=+*#%@",
  /** Detalhado: 70 níveis de cinza para alta precisão */
  detailed:
    " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  /** Blocos: estilo retrô / matriz de caracteres sólidos */
  blocks: " ░▒▓█",
  /** Minimalista: apenas 4 níveis de contraste alto */
  minimal: " .:#",
} as const;

export type CharsetName = keyof typeof CHARSETS;

export const DEFAULT_CHARSET = CHARSETS.standard;

/**
 * Converte um pixel em um caractere ASCII baseado na sua luminância.
 */
export function pixelToASCII(pixel: PixelColor, config: ASCIIConfig): string {
  const luminance = calculateLuminance(pixel);
  const maxIndex = config.charset.length - 1;

  let index = Math.floor((luminance * maxIndex) / 255);

  if (config.invertBrightness) {
    index = maxIndex - index;
  }

  return config.charset[index];
}
