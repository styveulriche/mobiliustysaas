import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import type { MapType } from '@/components/leaflet-map';

interface MapTypeToggleProps {
  mapType: MapType;
  onChange: (mapType: MapType) => void;
}

export function MapTypeToggle({ mapType, onChange }: MapTypeToggleProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onChange(mapType === 'street' ? 'satellite' : 'street')}
      style={[styles.button, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      hitSlop={8}
    >
      <Ionicons name={mapType === 'street' ? 'earth' : 'map'} size={20} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
