import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Theme } from '../theme';
import { reverseGeocode } from '../data';

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
  const [place, setPlace] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [center.lng, center.lat],
      // open closer so it reads as a real place, not an empty continent
      zoom: 8.5,
      attributionControl: false,
      pitchWithRotate: true,
      maxPitch: 70,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    // a marker at the spot you flew in to — gives the view an anchor
    const marker = new maplibregl.Marker({ color: '#5eb8ff' })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    // gentle cinematic ease toward the target after load
    map.once('load', () => {
      map.easeTo({ zoom: 10, duration: 1600, essential: true });
    });

    return () => {
      marker.remove();
      map.remove();
    };
    // center is a fresh object each open; intentionally mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // name the place so the satellite view has context (continuity with the globe)
  useEffect(() => {
    let active = true;
    reverseGeocode(center.lat, center.lng).then(p => {
      if (active && p) setPlace(p.label);
    });
    return () => {
      active = false;
    };
  }, [center.lat, center.lng]);

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
      {/* subtle grade so the raw imagery matches the app's cinematic feel */}
      <div className="map-grade" aria-hidden="true" />
      <button className="map-back" onClick={onExit} type="button" aria-label="Back to globe">
        <ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>Back to globe</span>
      </button>
      {place && (
        <div className="map-place" aria-live="polite">
          <span className="map-place-dot" aria-hidden="true" />
          {place}
        </div>
      )}
    </motion.div>
  );
}
