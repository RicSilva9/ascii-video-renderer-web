import { useCallback, useEffect, useRef, useState } from "react";
import { processImageDataToFrame } from "../engine/processFrame";
import { renderFrameToCanvas } from "../engine/canvasRenderer";
import type { ASCIIConfig } from "../types/ascii";

interface UseASCIIVideoParams {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: ASCIIConfig;
  /** Largura máxima em colunas ASCII */
  maxWidth?: number;
  /** Correção de aspect ratio dos caracteres monoespaçados */
  aspectCorrection?: number;
}

interface UseASCIIVideoReturn {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

/**
 * Lê frames de um <video>, converte para ASCII e renderiza num <canvas>
 * em sincronia com requestAnimationFrame.
 */
export function useASCIIVideo({
  videoRef,
  canvasRef,
  config,
  maxWidth = 120,
  aspectCorrection = 0.55,
}: UseASCIIVideoParams): UseASCIIVideoReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const rafIdRef = useRef<number | null>(null);

  // Refs para valores que mudam sem precisar recriar o loop
  const configRef = useRef(config);
  const maxWidthRef = useRef(maxWidth);
  const aspectCorrectionRef = useRef(aspectCorrection);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    maxWidthRef.current = maxWidth;
  }, [maxWidth]);

  useEffect(() => {
    aspectCorrectionRef.current = aspectCorrection;
  }, [aspectCorrection]);

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) {
      setIsPlaying(false);
      rafIdRef.current = null;
      return;
    }

    // Canvas offscreen só para extrair pixels do frame atual
    const sampleWidth = maxWidthRef.current;
    const sampleHeight = Math.max(
      1,
      Math.floor(
        sampleWidth *
          (video.videoHeight / video.videoWidth) *
          aspectCorrectionRef.current,
      ),
    );

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;

    const sampleCtx = sampleCanvas.getContext("2d", {
      willReadFrequently: true, // dica de performance pro browser
    });

    if (!sampleCtx) {
      rafIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    sampleCtx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const imageData = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight);

    const frame = processImageDataToFrame(imageData, configRef.current);
    renderFrameToCanvas(canvas, frame, configRef.current, 8);

    rafIdRef.current = requestAnimationFrame(renderFrame);
  }, [videoRef, canvasRef]);

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video
      .play()
      .then(() => {
        setIsPlaying(true);
        stopLoop();
        rafIdRef.current = requestAnimationFrame(renderFrame);
      })
      .catch(() => {
        setIsPlaying(false);
      });
  }, [videoRef, renderFrame, stopLoop]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    stopLoop();
  }, [videoRef, stopLoop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Cleanup obrigatório (StrictMode e unmount)
  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  return { isPlaying, play, pause, toggle };
}
