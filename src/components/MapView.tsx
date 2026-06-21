import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Theme } from '../theme';

interface MapViewProps {
  center: { lat: number; lng: number };
  theme: Theme;
  onExit: () => void;
}

// Esri World Imagery (satellite) + reference labels — no API key required.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    places: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'places', type: 'raster', source: 'places', paint: { 'raster-opacity': 0.9 } },
  ],
};

export default function MapView({ center, theme, onExit }: Readonly<MapViewProps>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [center.lng, center.lat],
      zoom: 5.4,
      attributionControl: false,
      pitchWithRotate: true,
      maxPitch: 70,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    // gentle cinematic ease toward the target after load
    map.once('load', () => {
      map.easeTo({ zoom: 6.6, duration: 1600, essential: true });
    });

    return () => map.remove();
    // center is a fresh object each open; intentionally mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="map-view"
      data-theme-map={theme}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <button className="map-back glass-pill" onClick={onExit}>
        <ArrowLeft size={16} strokeWidth={2.2} />
        <span>Back to globe</span>
      </button>
    </motion.div>
  );
}
