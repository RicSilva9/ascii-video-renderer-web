import type { PixelColor } from "../types/ascii";

/**
 * Calcula a luminância percebida de um pixel usando
 * o padrão ITU-R BT.601.
 *
 * Os pesos refletem a sensibilidade do olho humano:
 * - Verde: 58.7% (somos mais sensíveis)
 * - Vermelho: 29.9%
 * - Azul: 11.4% (somos menos sensíveis)
 *
 * @returns Valor de 0 (preto) a 255 (branco)
 */
export function calculateLuminance(pixel: PixelColor): number {
  return 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
}
