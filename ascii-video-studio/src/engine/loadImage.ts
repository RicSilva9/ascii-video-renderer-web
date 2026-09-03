/**
 * Carrega um arquivo de imagem, desenha num Canvas
 * redimensionado e devolve o ImageData dos pixels.
 *
 * @param file - Arquivo de imagem selecionado pelo usuário
 * @param maxWidth - Largura máxima em caracteres ASCII (colunas)
 * @returns Promise com o ImageData pronto para conversão
 */
export function loadImageFile(
  file: File,
  maxWidth: number,
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    // Validação básica
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo selecionado não é uma imagem."));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Libera a memória do ObjectURL assim que a imagem carrega
      URL.revokeObjectURL(objectUrl);

      // Calcula a altura mantendo a proporção
      // 0.55 corrige a proporção do caractere de terminal/monospace
      // (caracteres são mais altos do que largos)
      const aspectRatio = img.height / img.width;
      const width = maxWidth;
      const height = Math.floor(maxWidth * aspectRatio * 0.55);

      // Canvas off-screen (não precisa estar no DOM)
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível obter o contexto 2D do Canvas."));
        return;
      }

      // Desenha a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Extrai os pixels
      const imageData = ctx.getImageData(0, 0, width, height);
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Falha ao carregar a imagem."));
    };

    img.src = objectUrl;
  });
}
