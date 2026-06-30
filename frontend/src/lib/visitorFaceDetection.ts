export type VisitorFaceCheckStatus = 'loading' | 'ready' | 'blocked' | 'error';

export interface VisitorFaceCheck {
  canCapture: boolean;
  status: VisitorFaceCheckStatus;
  message: string;
}

const MODEL_URL = '/models/face-api';

type FaceApiModule = typeof import('@vladmandic/face-api');

let detectorLoad: Promise<FaceApiModule> | null = null;

export function loadVisitorFaceDetector(): Promise<FaceApiModule> {
  if (!detectorLoad) {
    detectorLoad = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      const tf = faceapi.tf as typeof faceapi.tf & {
        setBackend?: (backend: string) => Promise<unknown> | unknown;
        ready?: () => Promise<unknown> | unknown;
      };

      if (tf.setBackend) {
        await Promise.resolve(tf.setBackend('webgl')).catch(() => Promise.resolve(tf.setBackend?.('cpu')));
      }
      if (tf.ready) {
        await Promise.resolve(tf.ready());
      }
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      return faceapi;
    })();
  }

  return detectorLoad;
}

export async function checkVisitorFace(video: HTMLVideoElement): Promise<VisitorFaceCheck> {
  if (!video.videoWidth || !video.videoHeight) {
    return {
      canCapture: false,
      status: 'loading',
      message: 'Starting camera...',
    };
  }

  let faceapi: FaceApiModule;
  try {
    faceapi = await loadVisitorFaceDetector();
  } catch {
    return {
      canCapture: false,
      status: 'error',
      message: 'Face detector model could not load.',
    };
  }

  const detectorOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });
  const detections = await faceapi.detectAllFaces(video, detectorOptions);

  if (detections.length === 0) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'No human face detected. Look directly at the camera.',
    };
  }

  if (detections.length > 1) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Only one visitor face must be visible.',
    };
  }

  const detection = detections[0];
  const box = detection.box;
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  const width = box.width / frameWidth;
  const height = box.height / frameHeight;

  // Confidence gate: the tiny face detector only fires on human faces, so a
  // confident detection means a real human face is present.
  if (detection.score < 0.55) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Face is unclear. Improve lighting and hold still.',
    };
  }

  // Too small => face is too far away / not the subject.
  if (width < 0.12 || height < 0.12) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Move closer so the face is clearly visible.',
    };
  }

  // Too large => face is cropped by the frame.
  if (width > 0.92 || height > 0.95) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Move back slightly so the full face is visible.',
    };
  }

  return {
    canCapture: true,
    status: 'ready',
    message: 'Human face verified. Capture is enabled.',
  };
}
