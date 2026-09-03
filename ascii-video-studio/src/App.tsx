import { useState, useRef } from "react";
import { DEFAULT_CHARSET } from "./engine/asciiConverter";
import { loadImageFile } from "./engine/loadImage";
import { processImageDataToFrame } from "./engine/processFrame";
import { renderFrameToCanvas } from "./engine/canvasRenderer";
import type { ASCIIConfig } from "./types/ascii";

function App() {
  const [useColor, setUseColor] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Referência para a tag <canvas> no DOM
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Guarda o último ImageData processado para re-renderizar quando trocar o modo de cor
  const lastImageDataRef = useRef<ImageData | null>(null);

  const config: ASCIIConfig = {
    charset: DEFAULT_CHARSET,
    invertBrightness: false,
    useColor,
  };

  function processAndRender(imageData: ImageData, currentConfig: ASCIIConfig) {
    if (!canvasRef.current) return;

    // 1. Converte ImageData -> ASCIIFrame (com caracteres e cores)
    const frame = processImageDataToFrame(imageData, currentConfig);

    // 2. Renderiza no Canvas
    renderFrameToCanvas(canvasRef.current, frame, currentConfig, 10);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");

    try {
      const imageData = await loadImageFile(file, 120);
      lastImageDataRef.current = imageData;
      processAndRender(imageData, config);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar imagem.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleColorToggle() {
    const newColorState = !useColor;
    setUseColor(newColorState);

    if (lastImageDataRef.current) {
      processAndRender(lastImageDataRef.current, {
        ...config,
        useColor: newColorState,
      });
    }
  }

  return (
    <div
      style={{
        background: "#111",
        color: "#eee",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1>ASCII Video Studio</h1>
      <p>Renderização de Imagem em Canvas (ASCII + RGB)</p>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <input type="file" accept="image/*" onChange={handleFileChange} />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={useColor}
            onChange={handleColorToggle}
          />
          Ativar Cores RGB
        </label>
      </div>

      {isLoading && <p>Processando imagem...</p>}
      {error && <p style={{ color: "#f66" }}>{error}</p>}

      <div style={{ marginTop: "1rem", overflow: "auto" }}>
        {/* Nosso Canvas de Renderização */}
        <canvas
          ref={canvasRef}
          style={{
            background: "#000",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </div>
  );
}

export default App;
