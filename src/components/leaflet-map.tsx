import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapType = 'street' | 'satellite';

export interface LeafletMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
  heading?: number | null;
  variant?: 'bus' | 'user';
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface LeafletMapViewProps {
  center: LatLng;
  zoom?: number;
  mapType?: MapType;
  markers?: LeafletMarker[];
  /** Portion of the route already covered by the bus — rendered dimmed. */
  traveledPolyline?: LatLng[];
  /** Portion of the route still ahead — rendered as the live route highlight. */
  remainingPolyline?: LatLng[];
  style?: ViewStyle;
}

const TILE_URLS: Record<MapType, string> = {
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

/**
 * Open-source map (Leaflet + OpenStreetMap/Esri tiles) rendered in a WebView — the same stack
 * used on the web dashboard. Avoids requiring a Google Maps API key for the Android build.
 */
export function LeafletMapView({
  center,
  zoom = 14,
  mapType = 'street',
  markers = [],
  traveledPolyline = [],
  remainingPolyline = [],
  style,
}: LeafletMapViewProps) {
  const html = useMemo(
    () => buildHtml(center, zoom, mapType, markers, traveledPolyline, remainingPolyline),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      center.latitude,
      center.longitude,
      zoom,
      mapType,
      JSON.stringify(markers),
      JSON.stringify(traveledPolyline),
      JSON.stringify(remainingPolyline),
    ],
  );

  return (
    <View style={[styles.flex, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.flex}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

function buildHtml(
  center: LatLng,
  zoom: number,
  mapType: MapType,
  markers: LeafletMarker[],
  traveledPolyline: LatLng[],
  remainingPolyline: LatLng[],
) {
  const markersJs = markers
    .map((m) => {
      if (m.heading != null || m.variant) {
        const color = m.color ?? (m.variant === 'user' ? '#2563eb' : '#208AEF');
        const rotation = m.heading ?? 0;
        return `
    L.marker([${m.latitude}, ${m.longitude}], {
      icon: L.divIcon({
        className: '',
        html: '<div style="transform: rotate(${rotation}deg); width: 26px; height: 26px; display:flex; align-items:center; justify-content:center;">' +
          '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2 L20 20 L12 16 L4 20 Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/></svg></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    }).addTo(map)${m.title ? `.bindPopup(${JSON.stringify(m.title)})` : ''};`;
      }
      return `
    L.circleMarker([${m.latitude}, ${m.longitude}], { radius: 9, color: '${m.color ?? '#208AEF'}', fillColor: '${m.color ?? '#208AEF'}', fillOpacity: 1, weight: 2 })
      .addTo(map)${m.title ? `.bindPopup(${JSON.stringify(m.title)})` : ''};`;
    })
    .join('\n');

  const traveledJs =
    traveledPolyline.length > 1
      ? `L.polyline(${JSON.stringify(traveledPolyline.map((p) => [p.latitude, p.longitude]))}, { color: '#94a3b8', weight: 4 }).addTo(map);`
      : '';

  const remainingJs =
    remainingPolyline.length > 1
      ? `L.polyline(${JSON.stringify(remainingPolyline.map((p) => [p.latitude, p.longitude]))}, { color: '#208AEF', weight: 4 }).addTo(map);`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false })
      .setView([${center.latitude}, ${center.longitude}], ${zoom});
    L.tileLayer('${TILE_URLS[mapType]}', { maxZoom: 19 }).addTo(map);
    ${traveledJs}
    ${remainingJs}
    ${markersJs}
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
