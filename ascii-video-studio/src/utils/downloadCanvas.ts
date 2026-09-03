/**
 * Baixa o conteúdo atual de um canvas como arquivo de imagem PNG.
 *
 * @param canvas - Elemento canvas já renderizado
 * @param filename - Nome do arquivo sem extensão (default: ascii-art)
 */
export function downloadCanvasAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = "ascii-art",
): void {
  // Canvas vazio (ainda sem mídia) — evita baixar arquivo inútil
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error(
      "Não há conteúdo para baixar. Carregue uma imagem ou vídeo primeiro.",
    );
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error("Falha ao gerar a imagem para download.");
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filename}.png`;
    anchor.click();

    // Libera a memória do ObjectURL
    URL.revokeObjectURL(url);
  }, "image/png");
}
