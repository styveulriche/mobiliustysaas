import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export interface MyLocation {
  latitude: number;
  longitude: number;
  heading: number | null;
}

export function useMyLocation() {
  const [location, setLocation] = useState<MyLocation | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
        (loc) => {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  return location;
}
