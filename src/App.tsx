import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Globe, { type GlobeHandle } from './components/Globe';
import Landing from './components/Landing';
import ModeSwitcher from './components/ModeSwitcher';
import InfoPanel from './components/InfoPanel';
import Header from './components/Header';
import StarField from './components/StarField';
import ZoomControls from './components/ZoomControls';
import Toast from './components/Toast';
import type { Mode, LatLng, BlastType, ShrinkState, CountryInfo, City, Wonder, ISSPosition } from './types';

// MapLibre is heavy — only load it when the user actually zooms into the map
const MapView = lazy(() => import('./components/MapView'));
import { BLAST_TYPES, PASSPORT_DATA, detectPassportCountry, CITIES, fetchISS } from './data';
import { useTheme } from './theme';

const cityByName = (name: string): City => CITIES.find(c => c.name === name) ?? CITIES[0];

export default function App() {
  const { theme } = useTheme();
  const globeApi = useRef<GlobeHandle | null>(null);

  const [showLanding, setShowLanding] = useState(true);
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  // Fallback so the hero never waits forever (e.g. offline geojson fetch)
  useEffect(() => {
    const id = globalThis.setTimeout(() => setReady(true), 1800);
    return () => globalThis.clearTimeout(id);
  }, []);

  const [mode, setMode] = useState<Mode>('dig');
  const [selectedPoint, setSelectedPoint] = useState<LatLng | null>(null);
  const [blastType, setBlastType] = useState<BlastType>(BLAST_TYPES[0]);

  const [passportCode, setPassportCode] = useState('US');
  const [flightHours, setFlightHours] = useState(6);
  const [shrink, setShrink] = useState<ShrinkState>({ source: null, target: null });
  const [shrinkStage, setShrinkStage] = useState<'source' | 'target'>('source');

  const [mapTarget, setMapTarget] = useState<LatLng | null>(null);
  const mapOpen = mapTarget !== null;

  const [scaleCountry, setScaleCountry] = useState<CountryInfo | null>(null);
  const handleScaleInfo = useCallback((info: CountryInfo | null) => setScaleCountry(info), []);

  const [compareCodes, setCompareCodes] = useState<[string, string]>(['IN', 'CN']);
  const [timelineCode, setTimelineCode] = useState('IN');
  const [route, setRoute] = useState<{ from: City; to: City }>({
    from: cityByName('Mumbai'),
    to: cityByName('Tokyo'),
  });
  const [wonder, setWonder] = useState<Wonder | null>(null);
  const [iss, setIss] = useState<ISSPosition | null>(null);

  const handleCompareChange = useCallback((slot: 0 | 1, code: string) => {
    setCompareCodes(prev => (slot === 0 ? [code, prev[1]] : [prev[0], code]));
  }, []);
  const handleRouteChange = useCallback((slot: 'from' | 'to', name: string) => {
    setRoute(prev => ({ ...prev, [slot]: cityByName(name) }));
  }, []);

  // Live ISS position while in Space mode
  useEffect(() => {
    if (mode !== 'space') return;
    let active = true;
    const load = () => fetchISS().then(p => { if (active && p) setIss(p); });
    load();
    const id = globalThis.setInterval(load, 5000);
    return () => {
      active = false;
      globalThis.clearInterval(id);
    };
  }, [mode]);

  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    globalThis.setTimeout(() => setToast(t => (t === msg ? null : t)), 2600);
  }, []);

  // Auto-detect the user's passport once (manual override always available)
  useEffect(() => {
    let cancelled = false;
    detectPassportCountry().then(code => {
      if (!cancelled && code && PASSPORT_DATA[code]) setPassportCode(code);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePointClick = useCallback((lat: number, lng: number) => {
    setSelectedPoint({ lat, lng });
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        globeApi.current?.flyTo(latitude, longitude);
        setSelectedPoint({ lat: latitude, lng: longitude });
        setLocating(false);
        showToast('📍 Flying to your location');
      },
      () => {
        setLocating(false);
        showToast('Location permission denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }, [showToast]);

  const handleEnterMap = useCallback((lat: number, lng: number) => {
    setMapTarget({ lat, lng });
  }, []);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setSelectedPoint(null);
    setShrink({ source: null, target: null });
    setShrinkStage('source');
    setScaleCountry(null);
  };

  const resetShrink = () => {
    setShrink({ source: null, target: null });
    setShrinkStage('source');
  };

  const chromeVisible = !showLanding && !mapOpen;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-grad)' }}>
      {theme === 'dark' ? <StarField /> : <div className="sky" />}
      <div className="aurora" aria-hidden="true" />

      <Globe
        ref={globeApi}
        mode={mode}
        onPointClick={handlePointClick}
        selectedPoint={selectedPoint}
        blastType={blastType}
        isLanding={showLanding}
        passportCode={passportCode}
        flightHours={flightHours}
        shrink={shrink}
        shrinkStage={shrinkStage}
        onShrinkUpdate={setShrink}
        onEnterMap={handleEnterMap}
        mapOpen={mapOpen}
        onScaleInfo={handleScaleInfo}
        compareCodes={compareCodes}
        timelineCode={timelineCode}
        route={route}
        wonder={wonder}
        iss={iss}
        onInteract={() => setShowLanding(false)}
        onDoubleClick={handleLocate}
        onReady={handleReady}
      />

      <div className="vignette" />

      <AnimatePresence>
        {showLanding && <Landing ready={ready} onStart={() => setShowLanding(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {mapOpen && mapTarget && (
          <Suspense fallback={<div className="map-view" style={{ background: 'var(--bg)' }} />}>
            <MapView center={mapTarget} theme={theme} onExit={() => setMapTarget(null)} />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chromeVisible && (
          <motion.div
            className="chrome-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Header />
            <InfoPanel
              mode={mode}
              point={selectedPoint}
              blastType={blastType}
              onBlastTypeChange={setBlastType}
              blastTypes={BLAST_TYPES}
              passportCode={passportCode}
              onPassportChange={setPassportCode}
              flightHours={flightHours}
              onFlightHoursChange={setFlightHours}
              shrink={shrink}
              shrinkStage={shrinkStage}
              onAdvanceShrink={() => setShrinkStage('target')}
              onResetShrink={resetShrink}
              scaleCountry={scaleCountry}
              compareCodes={compareCodes}
              onCompareChange={handleCompareChange}
              timelineCode={timelineCode}
              onTimelineChange={setTimelineCode}
              route={route}
              onRouteChange={handleRouteChange}
              wonder={wonder}
              onWonderSelect={setWonder}
              iss={iss}
            />
            <ZoomControls globe={globeApi} onLocate={handleLocate} locating={locating} />
            <ModeSwitcher mode={mode} onChange={handleModeChange} />
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} />
    </div>
  );
}
