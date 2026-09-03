/**
 * Representa a cor de um único pixel no formato RGBA.
 * Cada canal varia de 0 a 255.
 */
export interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Configurações do renderizador ASCII.
 */
export interface ASCIIConfig {
  /** String de caracteres do mais claro ao mais denso */
  charset: string;
  /** Se true, inverte a escala (para fundo escuro) */
  invertBrightness: boolean;
}
