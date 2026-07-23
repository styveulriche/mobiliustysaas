export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Returns the index of the candidate closest to `point`, or -1 if the list is empty. */
export function nearestIndex(point: LatLng, candidates: LatLng[]): number {
  let best = -1;
  let bestDistance = Infinity;
  candidates.forEach((candidate, index) => {
    const distance = haversineMeters(point, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

/**
 * Splits an ordered list of stops into the portion already reached by the bus and the
 * portion still ahead, based on which stop the live position is currently closest to.
 */
export function splitRouteProgress(stops: LatLng[], busPosition: LatLng | null): { traveled: LatLng[]; remaining: LatLng[] } {
  if (!busPosition || stops.length === 0) {
    return { traveled: [], remaining: stops };
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;
  stops.forEach((stop, index) => {
    const distance = haversineMeters(stop, busPosition);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return {
    traveled: [...stops.slice(0, nearestIndex + 1), busPosition],
    remaining: [busPosition, ...stops.slice(nearestIndex + 1)],
  };
}
