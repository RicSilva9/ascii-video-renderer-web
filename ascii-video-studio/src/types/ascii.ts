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
  /** Se true, renderiza com as cores RGB originais */
  useColor: boolean;
}

/**
 * Representa uma "célula" do resultado ASCII,
 * contendo o caractere e a cor do pixel original.
 */
export interface ASCIICell {
  char: string;
  r: number;
  g: number;
  b: number;
}

/**
 * O resultado do processamento de um frame inteiro.
 */
export interface ASCIIFrame {
  cells: ASCIICell[];
  width: number; // número de colunas
  height: number; // número de linhas
}
