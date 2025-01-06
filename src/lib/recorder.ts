import { hidePluginWindow } from "./utils";
import { v4 as uuid } from "uuid";
import io from "socket.io-client"

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder | undefined;
let userId: string;


const socket = io(import.meta.env.VITE_SOCKET_URL as string)

export const startRecording = (onSources: {
  screen: string;
  id: string;
  audio: string;
}) => {
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources?.id.slice(0, 8)}.webm`;
  if (mediaRecorder) {
    mediaRecorder.start(1000);
  } else {
    console.error("mediaRecorder is not initialized");
  }
};

const onStopRecording = () => {
    hidePluginWindow(false)
    socket.emit("process-video", {
        filename: videoTransferFileName,
        userId,
    })
}

export const stopRecording = () => mediaRecorder?.stop();

export const onDataAvailable = (e: BlobEvent) => {
    alert('running')
    socket.emit("video-chunks", {
        chunks: e.data,
        filename: videoTransferFileName
    })
}

export const selectSources = async (
  onSources: {
    screen: string;
    audio: string;
    preset: "HD" | "SD";
    id: string;
  },
  videoElement: React.RefObject<HTMLVideoElement>
) => {
  if (onSources && onSources.audio && onSources.id && onSources.screen) {
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: onSources.screen,
          minWidth: onSources.preset === "HD" ? 1920 : 1280,
          maxWidth: onSources.preset === "HD" ? 1920 : 1280,
          minHeight: onSources.preset === "HD" ? 1080 : 720,
          maxHeight: onSources.preset === "HD" ? 1080 : 720,
          frameRate: 30,
        },
      },
    };
    userId = onSources.id;

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const audioStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: onSources.audio ? { deviceId: { exact: onSources.audio } } : false,
    });

    if (videoElement && videoElement.current) {
      videoElement.current.srcObject = stream;
      await videoElement.current.play()
    }

    const combineStream = new MediaStream([
        ...stream.getTracks(),
        ...audioStream.getTracks()
    ])

    mediaRecorder = new MediaRecorder(combineStream, {
        mimeType: "video/webm; codecs=vp9"
    })

    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = onStopRecording
  }
};
