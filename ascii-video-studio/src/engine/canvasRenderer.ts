import type { ASCIIFrame, ASCIIConfig } from "../types/ascii";

/**
 * Renderiza um ASCIIFrame em um elemento HTMLCanvasElement.
 *
 * @param canvas - O elemento canvas onde será desenhado
 * @param frame - Dados do frame ASCII (células + dimensões)
 * @param config - Configurações (ex: usar cor ou monocromático)
 * @param fontSize - Tamanho da fonte em pixels (padrão: 10px)
 */
export function renderFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: ASCIIFrame,
  config: ASCIIConfig,
  fontSize: number = 10,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Fontes monoespaçadas garantem largura idêntica para todos os caracteres
  const fontName = "Courier New, monospace";
  ctx.font = `${fontSize}px ${fontName}`;

  // Medimos a largura do caractere para calcular a grade exata
  const charWidth = ctx.measureText("M").width;
  const charHeight = fontSize; // altura proporcional

  // Ajustamos o tamanho do canvas para caber a grade exata
  canvas.width = frame.width * charWidth;
  canvas.height = frame.height * charHeight;

  // Reconfiguramos a fonte após mudar o tamanho do canvas (o canvas reseta o contexto)
  ctx.font = `${fontSize}px ${fontName}`;
  ctx.textBaseline = "top";

  // Fundo preto
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Renderiza cada célula
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const cellIndex = y * frame.width + x;
      const cell = frame.cells[cellIndex];

      if (!cell) continue;

      // Se a cor estiver ligada, usa a cor do pixel. Se não, usa branco.
      if (config.useColor) {
        ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
      } else {
        ctx.fillStyle = "#ffffff";
      }

      // Desenha o caractere na posição exata da grade
      const posX = x * charWidth;
      const posY = y * charHeight;
      ctx.fillText(cell.char, posX, posY);
    }
  }
}
