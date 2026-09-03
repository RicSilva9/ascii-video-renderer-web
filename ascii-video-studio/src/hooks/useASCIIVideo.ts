import { useCallback, useEffect, useRef, useState } from "react";
import { processImageDataToFrame } from "../engine/processFrame";
import { renderFrameToCanvas } from "../engine/canvasRenderer";
import type { ASCIIConfig } from "../types/ascii";

interface UseASCIIVideoParams {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config: ASCIIConfig;
  maxWidth?: number;
  aspectCorrection?: number;
}

export function useASCIIVideo({
  videoRef,
  canvasRef,
  config,
  maxWidth = 120,
  aspectCorrection = 0.55,
}: UseASCIIVideoParams) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Métricas de Performance
  const [fps, setFps] = useState(0);
  const [frameTimeMs, setFrameTimeMs] = useState(0);

  // Refs de controle de loop
  const rafIdRef = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number>(-1);

  // Refs para cálculo de FPS
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());

  // Refs de reciclagem de Canvas Offscreen
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Refs de parâmetros reativos
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

  const getOffscreenContext = useCallback((width: number, height: number) => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
      offscreenCtxRef.current = offscreenCanvasRef.current.getContext("2d", {
        willReadFrequently: true,
      });
    }

    const canvas = offscreenCanvasRef.current;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    return offscreenCtxRef.current;
  }, []);

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) {
      setIsPlaying(false);
      rafIdRef.current = null;
      return;
    }

    // Deduplicação de quadros (Frame Skipping)
    if (video.currentTime === lastProcessedTimeRef.current) {
      rafIdRef.current = requestAnimationFrame(renderFrame);
      return;
    }
    lastProcessedTimeRef.current = video.currentTime;

    // Cronômetro do Frame (Início)
    const startTime = performance.now();

    const sampleWidth = maxWidthRef.current;
    const sampleHeight = Math.max(
      1,
      Math.floor(
        sampleWidth *
          (video.videoHeight / video.videoWidth) *
          aspectCorrectionRef.current,
      ),
    );

    const sampleCtx = getOffscreenContext(sampleWidth, sampleHeight);

    if (sampleCtx) {
      sampleCtx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const imageData = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight);

      const frame = processImageDataToFrame(imageData, configRef.current);
      renderFrameToCanvas(canvas, frame, configRef.current, 8);
    }

    // Cronômetro do Frame (Fim)
    const duration = performance.now() - startTime;

    // Atualiza contadores de FPS a cada 500ms para a UI não piscar demais
    frameCountRef.current += 1;
    const now = performance.now();
    const elapsed = now - lastFpsUpdateRef.current;

    if (elapsed >= 500) {
      const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
      setFps(currentFps);
      setFrameTimeMs(Number(duration.toFixed(1)));

      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    rafIdRef.current = requestAnimationFrame(renderFrame);
  }, [videoRef, canvasRef, getOffscreenContext]);

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
        lastProcessedTimeRef.current = -1;
        lastFpsUpdateRef.current = performance.now();
        frameCountRef.current = 0;
        rafIdRef.current = requestAnimationFrame(renderFrame);
      })
      .catch(console.error);
  }, [videoRef, renderFrame, stopLoop]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
    stopLoop();
  }, [videoRef, stopLoop]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return { isPlaying, play, pause, toggle, fps, frameTimeMs };
}
