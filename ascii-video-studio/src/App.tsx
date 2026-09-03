import { useMemo, useRef, useState } from "react";
import { CHARSETS, type CharsetName } from "./engine/asciiConverter";
import { loadImageFile } from "./engine/loadImage";
import { processImageDataToFrame } from "./engine/processFrame";
import { renderFrameToCanvas } from "./engine/canvasRenderer";
import { useASCIIVideo } from "./hooks/useASCIIVideo";
import { useASCIIRecorder } from "./hooks/useASCIIRecorder";
import { downloadCanvasAsPNG } from "./utils/downloadCanvas";
import type { ASCIIConfig } from "./types/ascii";

type MediaType = "none" | "image" | "video";

function App() {
  // Estados de Configuração
  const [useColor, setUseColor] = useState(true);
  const [columns, setColumns] = useState(120);
  const [selectedCharset, setSelectedCharset] =
    useState<CharsetName>("standard");

  // Estados de Mídia e UI
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [mediaName, setMediaName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const lastImageDataRef = useRef<ImageData | null>(null);

  // Configuração Reativa
  const config: ASCIIConfig = useMemo(
    () => ({
      charset: CHARSETS[selectedCharset],
      invertBrightness: false,
      useColor,
    }),
    [useColor, selectedCharset],
  );

  // Hook de Reprodução de Vídeo (com métricas)
  const { isPlaying, toggle, pause, play, fps, frameTimeMs } = useASCIIVideo({
    videoRef,
    canvasRef,
    config,
    maxWidth: columns,
  });

  // Hook de Gravação de Vídeo WebM
  const { isRecording, startRecording, stopRecording } = useASCIIRecorder({
    canvasRef,
    videoRef,
    filename: mediaName
      ? `${mediaName.replace(/\.[^/.]+$/, "")}-ascii`
      : "ascii-video",
  });

  function clearResources() {
    pause();
    if (isRecording) stopRecording();

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    lastImageDataRef.current = null;
  }

  async function processImage(file: File) {
    setIsLoading(true);
    try {
      const imageData = await loadImageFile(file, columns);
      lastImageDataRef.current = imageData;

      if (canvasRef.current) {
        const frame = processImageDataToFrame(imageData, config);
        renderFrameToCanvas(canvasRef.current, frame, config, 8);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar imagem.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    clearResources();
    setMediaName(file.name);

    if (file.type.startsWith("image/")) {
      setMediaType("image");
      processImage(file);
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
      }
    } else {
      setMediaType("none");
      setError("Formato não suportado. Por favor, envie uma Imagem ou Vídeo.");
    }
  }

  function reRenderImageIfNeeded(newColumns = columns, newConfig = config) {
    if (
      mediaType === "image" &&
      lastImageDataRef.current &&
      canvasRef.current
    ) {
      // Observação: para mudança de colunas em imagem, o ideal é recarregar o arquivo.
      // Aqui reprocessamos o ImageData já amostrado (mesma resolução de sample).
      const frame = processImageDataToFrame(
        lastImageDataRef.current,
        newConfig,
      );
      renderFrameToCanvas(canvasRef.current, frame, newConfig, 8);
    }

    // Silencia warning de parâmetro não usado em alguns lints
    void newColumns;
  }

  function handleDownloadPNG() {
    if (!canvasRef.current) return;

    try {
      const baseName = mediaName
        ? mediaName.replace(/\.[^/.]+$/, "")
        : "ascii-art";

      downloadCanvasAsPNG(canvasRef.current, `${baseName}-ascii`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar a imagem.");
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
      <h1 style={{ marginTop: 0 }}>ASCII Video Studio</h1>
      <p style={{ opacity: 0.8 }}>
        Transforme Imagens e Vídeos em ASCII Art em tempo real
      </p>

      {/* Painel de Controle Principal */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "center",
          background: "#222",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}
      >
        {/* Upload */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "0.2rem",
            }}
          >
            Arquivo (Imagem ou Vídeo)
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Resolução */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "0.2rem",
            }}
          >
            Resolução: {columns} colunas
          </label>
          <input
            type="range"
            min="40"
            max="200"
            step="10"
            value={columns}
            onChange={(e) => {
              const val = Number(e.target.value);
              setColumns(val);
              reRenderImageIfNeeded(val, config);
            }}
          />
        </div>

        {/* Charset */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              marginBottom: "0.2rem",
            }}
          >
            Estilo do Charset
          </label>
          <select
            value={selectedCharset}
            onChange={(e) => {
              const val = e.target.value as CharsetName;
              setSelectedCharset(val);
              const newConfig = { ...config, charset: CHARSETS[val] };
              reRenderImageIfNeeded(columns, newConfig);
            }}
            style={{
              padding: "0.3rem",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            <option value="standard">Padrão (10 níveis)</option>
            <option value="detailed">Detalhado (70 níveis)</option>
            <option value="blocks">Blocos Retro</option>
            <option value="minimal">Minimalista</option>
          </select>
        </div>

        {/* Toggle RGB */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          <input
            type="checkbox"
            checked={useColor}
            onChange={() => {
              const newColor = !useColor;
              setUseColor(newColor);
              reRenderImageIfNeeded(columns, { ...config, useColor: newColor });
            }}
          />
          Cores RGB
        </label>
      </div>

      {/* Painel de Ações e Exportação */}
      {mediaType !== "none" && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          {mediaType === "video" && (
            <>
              <button
                onClick={toggle}
                style={{
                  padding: "0.5rem 1.5rem",
                  background: isPlaying ? "#e53935" : "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              {!isRecording ? (
                <button
                  onClick={() => {
                    if (!isPlaying) play();
                    startRecording();
                  }}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#ff9800",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  🔴 Gravar Vídeo (.webm)
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ⏹️ Parar Gravação
                </button>
              )}
            </>
          )}

          <button
            onClick={handleDownloadPNG}
            style={{
              padding: "0.5rem 1.5rem",
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📸 Baixar Frame (.png)
          </button>
        </div>
      )}

      {/* Feedback de Estado */}
      {mediaName && (
        <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
          Arquivo: {mediaName} ({mediaType.toUpperCase()})
          {isRecording && (
            <strong style={{ color: "#f44336", marginLeft: "10px" }}>
              GRAVANDO...
            </strong>
          )}
        </p>
      )}

      {/* Badge de Métricas de Performance */}
      {mediaType === "video" && isPlaying && (
        <div
          style={{
            display: "inline-flex",
            gap: "1rem",
            background: "#1a237e",
            color: "#82b1ff",
            padding: "0.4rem 0.8rem",
            borderRadius: "4px",
            fontSize: "0.85rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            fontFamily: "monospace",
          }}
        >
          <span>⚡ FPS: {fps}</span>
          <span>⏱️ Frame Time: {frameTimeMs} ms</span>
        </div>
      )}

      {isLoading && <p>Carregando e processando mídia...</p>}
      {error && <p style={{ color: "#f66" }}>{error}</p>}

      {/* Tag de vídeo escondida */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        preload="auto"
      />

      {/* Canvas Principal */}
      <div style={{ marginTop: "1rem", overflow: "auto" }}>
        <canvas
          ref={canvasRef}
          style={{
            background: "#000",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            maxWidth: "100%",
          }}
        />
      </div>
    </div>
  );
}

export default App;
