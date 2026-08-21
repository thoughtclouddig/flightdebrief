import type { TrackPosition } from "@/lib/types";

export const MAX_DISPLAY_TRACK_POINTS = 600;

function isUsablePosition(position: TrackPosition) {
  return (
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lon) &&
    Math.abs(position.lat) <= 90 &&
    Math.abs(position.lon) <= 180
  );
}

function squaredDistanceToSegment(
  point: readonly [number, number],
  start: readonly [number, number],
  end: readonly [number, number],
) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];

  if (deltaX === 0 && deltaY === 0) {
    const pointX = point[0] - start[0];
    const pointY = point[1] - start[1];
    return pointX * pointX + pointY * pointY;
  }

  const ratio = Math.max(
    0,
    Math.min(1, ((point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY) / (deltaX * deltaX + deltaY * deltaY)),
  );
  const pointX = point[0] - (start[0] + ratio * deltaX);
  const pointY = point[1] - (start[1] + ratio * deltaY);
  return pointX * pointX + pointY * pointY;
}

function simplifyWithTolerance(track: TrackPosition[], projected: Array<readonly [number, number]>, tolerance: number) {
  const lastIndex = track.length - 1;
  const retained = new Uint8Array(track.length);
  retained[0] = 1;
  retained[lastIndex] = 1;
  const pendingSegments: Array<readonly [number, number]> = [[0, lastIndex]];
  const squaredTolerance = tolerance * tolerance;

  while (pendingSegments.length > 0) {
    const [startIndex, endIndex] = pendingSegments.pop()!;
    let greatestDistance = squaredTolerance;
    let greatestDistanceIndex = -1;

    for (let index = startIndex + 1; index < endIndex; index++) {
      const distance = squaredDistanceToSegment(projected[index], projected[startIndex], projected[endIndex]);
      if (distance > greatestDistance) {
        greatestDistance = distance;
        greatestDistanceIndex = index;
      }
    }

    if (greatestDistanceIndex !== -1) {
      retained[greatestDistanceIndex] = 1;
      pendingSegments.push([startIndex, greatestDistanceIndex], [greatestDistanceIndex, endIndex]);
    }
  }

  return track.filter((_, index) => retained[index] === 1);
}

/**
 * Returns valid, representative route points for maps and SVG previews.
 * The source flight track is never mutated or rewritten.
 */
export function simplifyTrackForDisplay(
  track: TrackPosition[] | null,
  maxPoints = MAX_DISPLAY_TRACK_POINTS,
): TrackPosition[] | null {
  if (!track) return null;

  const usableTrack = track.filter(isUsablePosition);
  if (usableTrack.length <= 2) return [...usableTrack];

  const pointLimit = Math.max(2, Math.floor(maxPoints));
  if (usableTrack.length <= pointLimit) return [...usableTrack];

  const averageLatitude = usableTrack.reduce((total, point) => total + point.lat, 0) / usableTrack.length;
  const longitudeScale = Math.max(Math.cos((averageLatitude * Math.PI) / 180), 0.01);
  const projected = usableTrack.map((point) => [point.lon * longitudeScale, point.lat] as const);

  let maximumDeviation = 0;
  for (let index = 1; index < projected.length - 1; index++) {
    maximumDeviation = Math.max(
      maximumDeviation,
      Math.sqrt(squaredDistanceToSegment(projected[index], projected[0], projected[projected.length - 1])),
    );
  }

  let lowerTolerance = 0;
  let upperTolerance = maximumDeviation * 1.01 + Number.EPSILON;
  let simplified = simplifyWithTolerance(usableTrack, projected, upperTolerance);

  // Find the most detailed Douglas-Peucker result that fits the display budget.
  for (let iteration = 0; iteration < 20; iteration++) {
    const tolerance = (lowerTolerance + upperTolerance) / 2;
    const candidate = simplifyWithTolerance(usableTrack, projected, tolerance);

    if (candidate.length > pointLimit) {
      lowerTolerance = tolerance;
    } else {
      simplified = candidate;
      upperTolerance = tolerance;
    }
  }

  return simplified;
}