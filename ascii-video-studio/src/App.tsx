import { useState } from "react";
import { DEFAULT_CHARSET } from "./engine/asciiConverter";
import { imageDataToASCII } from "./engine/imageToASCII";
import { loadImageFile } from "./engine/loadImage";
import type { ASCIIConfig } from "./types/ascii";

function App() {
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const config: ASCIIConfig = {
    charset: DEFAULT_CHARSET,
    invertBrightness: false,
  };

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");
    setAsciiArt("");

    try {
      // 120 colunas de ASCII — bom equilíbrio entre detalhe e performance
      const imageData = await loadImageFile(file, 120);
      const result = imageDataToASCII(imageData, config);
      setAsciiArt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#111",
        color: "#eee",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "monospace",
      }}
    >
      <h1>ASCII Video Studio</h1>
      <p>Selecione uma imagem para converter em ASCII Art</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ margin: "1rem 0" }}
      />

      {isLoading && <p>Processando...</p>}
      {error && <p style={{ color: "#f66" }}>{error}</p>}

      {asciiArt && (
        <pre
          style={{
            fontSize: "6px",
            lineHeight: "1",
            letterSpacing: "0",
            overflow: "auto",
            background: "#000",
            padding: "1rem",
            borderRadius: "4px",
          }}
        >
          {asciiArt}
        </pre>
      )}
    </div>
  );
}

export default App;
