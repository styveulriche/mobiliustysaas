import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export interface LeafletMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
}

interface LeafletMapViewProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: LeafletMarker[];
  polyline?: { latitude: number; longitude: number }[];
  style?: ViewStyle;
}

/**
 * Open-source map (Leaflet + OpenStreetMap tiles) rendered in a WebView — the same stack
 * used on the web dashboard. Avoids requiring a Google Maps API key for the Android build.
 */
export function LeafletMapView({ center, zoom = 14, markers = [], polyline = [], style }: LeafletMapViewProps) {
  const html = useMemo(
    () => buildHtml(center, zoom, markers, polyline),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [center.latitude, center.longitude, zoom, JSON.stringify(markers), JSON.stringify(polyline)],
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
  center: { latitude: number; longitude: number },
  zoom: number,
  markers: LeafletMarker[],
  polyline: { latitude: number; longitude: number }[],
) {
  const markersJs = markers
    .map(
      (m) => `
    L.circleMarker([${m.latitude}, ${m.longitude}], { radius: 9, color: '${m.color ?? '#208AEF'}', fillColor: '${m.color ?? '#208AEF'}', fillOpacity: 1, weight: 2 })
      .addTo(map)${m.title ? `.bindPopup(${JSON.stringify(m.title)})` : ''};`,
    )
    .join('\n');

  const polylineJs =
    polyline.length > 1
      ? `L.polyline(${JSON.stringify(polyline.map((p) => [p.latitude, p.longitude]))}, { color: '#208AEF', weight: 4 }).addTo(map);`
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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    ${polylineJs}
    ${markersJs}
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
