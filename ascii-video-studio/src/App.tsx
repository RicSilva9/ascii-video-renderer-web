import { useMemo, useRef, useState } from "react";
import { DEFAULT_CHARSET } from "./engine/asciiConverter";
import { useASCIIVideo } from "./hooks/useASCIIVideo";
import type { ASCIIConfig } from "./types/ascii";

function App() {
  const [useColor, setUseColor] = useState(true);
  const [error, setError] = useState("");
  const [hasVideo, setHasVideo] = useState(false);
  const [videoName, setVideoName] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const config: ASCIIConfig = useMemo(
    () => ({
      charset: DEFAULT_CHARSET,
      invertBrightness: false,
      useColor,
    }),
    [useColor],
  );

  const { isPlaying, play, pause, toggle } = useASCIIVideo({
    videoRef,
    canvasRef,
    config,
    maxWidth: 120,
  });

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Selecione um arquivo de vídeo válido (ex: MP4, WebM).");
      return;
    }

    setError("");
    pause();
    clearObjectUrl();

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setVideoName(file.name);
    setHasVideo(true);

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();
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
      <p>Renderização de vídeo em ASCII + RGB no Canvas</p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <input type="file" accept="video/*" onChange={handleFileChange} />

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
            onChange={() => setUseColor((prev) => !prev)}
          />
          Ativar Cores RGB
        </label>

        <button onClick={toggle} disabled={!hasVideo}>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {videoName && (
        <p style={{ opacity: 0.7, marginBottom: "1rem" }}>
          Arquivo: {videoName}
        </p>
      )}

      {error && <p style={{ color: "#f66" }}>{error}</p>}

      {/* Vídeo oculto: ele só alimenta frames + áudio */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        preload="auto"
      />

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

      {!hasVideo && (
        <p style={{ opacity: 0.6, marginTop: "1rem" }}>
          Selecione um vídeo MP4/WebM para começar.
        </p>
      )}
    </div>
  );
}

export default App;
