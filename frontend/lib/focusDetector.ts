import type { FocusStatus } from "@/types/ws";

type StopFn = () => void;

export async function startFocusDetection(
  video: HTMLVideoElement,
  onStatusChange: (status: FocusStatus) => void
): Promise<StopFn> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
  });

  // Start webcam
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise<void>((res) => { video.onloadeddata = () => res(); });

  let lastStatus: FocusStatus = "focused";
  let pendingStatus: FocusStatus = "focused";
  let pendingSince = Date.now();
  let running = true;
  let lastTs = 0;

  const DEBOUNCE_MS = 1000;
  const DISTRACT_THRESHOLD = 0.4;

  function detect() {
    if (!running) return;

    const now = performance.now();
    if (now - lastTs < 150) {
      requestAnimationFrame(detect);
      return;
    }
    lastTs = now;

    const result = faceLandmarker.detectForVideo(video, now);

    let status: FocusStatus = "away";

    if (result.faceLandmarks.length > 0 && result.faceBlendshapes?.length) {
      const shapes = result.faceBlendshapes[0].categories;
      const get = (name: string) => shapes.find((s) => s.categoryName === name)?.score ?? 0;

      const lookOut = get("eyeLookOutRight") > DISTRACT_THRESHOLD || get("eyeLookOutLeft") > DISTRACT_THRESHOLD;
      const lookUp = get("eyeLookUp") > DISTRACT_THRESHOLD;

      status = lookOut || lookUp ? "distracted" : "focused";
    }

    // Debounce: only emit after status persists for DEBOUNCE_MS
    if (status !== pendingStatus) {
      pendingStatus = status;
      pendingSince = Date.now();
    } else if (status !== lastStatus && Date.now() - pendingSince >= DEBOUNCE_MS) {
      lastStatus = status;
      onStatusChange(status);
    }

    requestAnimationFrame(detect);
  }

  requestAnimationFrame(detect);

  return () => {
    running = false;
    stream.getTracks().forEach((t) => t.stop());
    faceLandmarker.close();
  };
}
