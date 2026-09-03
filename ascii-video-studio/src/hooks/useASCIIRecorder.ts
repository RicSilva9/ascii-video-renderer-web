import { useCallback, useRef, useState } from "react";

interface UseASCIIRecorderParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  filename?: string;
}

interface UseASCIIRecorderReturn {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

/**
 * Hook para gravar a renderização do Canvas e o áudio do vídeo
 * em um arquivo de vídeo WebM usando a MediaRecorder API.
 */
export function useASCIIRecorder({
  canvasRef,
  videoRef,
  filename = "ascii-video",
}: UseASCIIRecorderParams): UseASCIIRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas) {
      console.warn("Canvas não disponível para gravação.");
      return;
    }

    try {
      // 1. Captura a trilha de vídeo do Canvas a 30 FPS
      const canvasStream = canvas.captureStream(30);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      // 2. Tenta capturar a trilha de áudio do vídeo original (se existir)
      if (video) {
        // Compatibilidade com diferentes navegadores
        const videoStream =
          "captureStream" in video
            ? (
                video as unknown as { captureStream: () => MediaStream }
              ).captureStream()
            : "mozCaptureStream" in video
              ? (
                  video as unknown as { mozCaptureStream: () => MediaStream }
                ).mozCaptureStream()
              : null;

        if (videoStream) {
          const audioTracks = videoStream.getAudioTracks();
          if (audioTracks.length > 0) {
            tracks.push(audioTracks[0]); // Junta o áudio na gravação!
          }
        }
      }

      // 3. Combina vídeo do Canvas + áudio original em um único Stream
      const combinedStream = new MediaStream(tracks);

      // 4. Determina o formato suportado pelo navegador (VP9 ou padrão WebM)
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      chunksRef.current = [];

      // Recebe os pedaços de vídeo durante a gravação
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Quando a gravação parar, junta tudo num arquivo e dispara o download
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.webm`;
        a.click();

        URL.revokeObjectURL(url);
        chunksRef.current = [];
      };

      // Inicia a gravação enviando dados a cada 100ms
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  }, [canvasRef, videoRef, filename]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
}
