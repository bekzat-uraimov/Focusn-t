import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export interface HeadPose {
  pitch: number; // degrees, negative = looking down
  yaw: number;   // degrees, negative = looking left
  roll: number;  // degrees
  facePresent: boolean;
}

/**
 * Extracts Euler angles from the 4×4 facial transformation matrix MediaPipe
 * provides in facialTransformationMatrixes[0].data (column-major, 16 floats).
 *
 * Column-major layout:
 *   [ R00 R10 R20 0 ]   indices 0,1,2,4
 *   [ R01 R11 R21 0 ]
 *   [ R02 R12 R22 0 ]
 *   [ tx  ty  tz  1 ]
 */
function matrixToEuler(m: number[]): { pitch: number; yaw: number; roll: number } {
  // Extract rotation submatrix (column-major)
  const r00 = m[0];
  const r01 = m[4];
  const r02 = m[8], r12 = m[9], r22 = m[10];

  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  // Standard ZYX Euler decomposition
  const pitch = toDeg(Math.atan2(-r12, r22));       // rotation around X (up/down)
  const yaw   = toDeg(Math.atan2(r02, Math.sqrt(r12 ** 2 + r22 ** 2))); // rotation around Y (left/right) — note: flipped sign convention below
  const roll  = toDeg(Math.atan2(-r01, r00));       // rotation around Z (tilt)

  // MediaPipe's coordinate system: positive yaw = looking RIGHT in mirror view.
  // Negate yaw so positive = user looking right from their own perspective.
  return { pitch, yaw: -yaw, roll };
}

export function extractHeadPose(result: FaceLandmarkerResult): HeadPose {
  if (
    !result.facialTransformationMatrixes ||
    result.facialTransformationMatrixes.length === 0
  ) {
    return { pitch: 0, yaw: 0, roll: 0, facePresent: false };
  }

  const matrix = result.facialTransformationMatrixes[0].data;
  const { pitch, yaw, roll } = matrixToEuler(matrix);

  return { pitch, yaw, roll, facePresent: true };
}

/**
 * Returns true if head pose is within focused thresholds.
 */
export function isPoseDistracted(
  pose: HeadPose,
  yawLimit: number,
  pitchUpLimit: number,
  pitchDownLimit: number
): boolean {
  if (!pose.facePresent) return false; // handled separately as "away"
  return (
    Math.abs(pose.yaw) > yawLimit ||
    pose.pitch > pitchUpLimit ||
    pose.pitch < pitchDownLimit
  );
}
