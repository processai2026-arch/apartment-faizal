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

      await faceapi.tf.setBackend('webgl').catch(() => faceapi.tf.setBackend('cpu'));
      await faceapi.tf.ready();
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
    inputSize: 224,
    scoreThreshold: 0.55,
  });
  const detections = await faceapi.detectAllFaces(video, detectorOptions);

  if (detections.length === 0) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'No face detected. Look directly at the camera.',
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
  const left = box.x / frameWidth;
  const top = box.y / frameHeight;
  const right = (box.x + box.width) / frameWidth;
  const bottom = (box.y + box.height) / frameHeight;
  const width = box.width / frameWidth;
  const height = box.height / frameHeight;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  if (detection.score < 0.6) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Face is unclear. Improve lighting and hold still.',
    };
  }

  if (left < 0.05 || top < 0.05 || right > 0.95 || bottom > 0.97) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Full face must be inside the frame.',
    };
  }

  if (width < 0.22 || height < 0.22) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Move closer so the face is clear.',
    };
  }

  if (width > 0.72 || height > 0.82) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Move back slightly so the full face is visible.',
    };
  }

  if (centerX < 0.32 || centerX > 0.68 || centerY < 0.25 || centerY > 0.7) {
    return {
      canCapture: false,
      status: 'blocked',
      message: 'Center the face in the frame.',
    };
  }

  return {
    canCapture: true,
    status: 'ready',
    message: 'Face verified. Capture is enabled.',
  };
}
