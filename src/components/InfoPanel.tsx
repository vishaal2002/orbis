import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, animate, type PanInfo } from 'framer-motion';
import { useMediaQuery } from '../lib/useMediaQuery';
import type { Mode, LatLng, BlastType, ShrinkState, City, Wonder, ISSPosition, WeatherInfo, FlightMode } from '../types';
import {
  getLocationLabel,
  getAntipode,
  getNearestCity,
  getPopulationInRadius,
  getCitiesInRadius,
  getClimateTwins,
  koppenLabel,
  climateSimilarity,
  getBlastZones,
  subsolarPoint,
  solarElevation,
  isDaylight,
  hiroshimaEquivalent,
  mercatorAreaFactor,
  getScaleComparisons,
  EARTH_LAND_AREA,
  PASSPORT_LIST,
  PASSPORT_DATA,
  summarizeVisa,
  passportRank,
  VISA_DATA_META,
  COUNTRY_FACT_LIST,
  getCountryFact,
  getFlightInfo,
  NATURAL_WONDERS,
  CITIES,
  fetchWeather,
  estimateUtcOffset,
  fetchCountryTimeline,
  TIMELINE_INDICATORS,
  type TimelineIndicator,
  countryDensity,
  DENSITY_BINS,
  COUNTRY_FACTS,
  densityColor,
  type PlaceInfo,
} from '../data';

interface InfoPanelProps {
  mode: Mode;
  point: LatLng | null;
  place: PlaceInfo | null;
  blastType: BlastType;
  onBlastTypeChange: (b: BlastType) => void;
  blastTypes: BlastType[];
  passportCode: string;
  onPassportChange: (code: string) => void;
  flightHours: number;
  onFlightHoursChange: (h: number) => void;
  flightMode: FlightMode;
  onFlightModeChange: (m: FlightMode) => void;
  shrink: ShrinkState;
  shrinkStage: 'source' | 'target';
  onAdvanceShrink: () => void;
  onResetShrink: () => void;
  compareCodes: [string, string];
  onCompareChange: (slot: 0 | 1, code: string) => void;
  timelineCode: string;
  onTimelineChange: (code: string) => void;
  route: { from: City; to: City };
  onRouteChange: (slot: 'from' | 'to', name: string) => void;
  wonder: Wonder | null;
  onWonderSelect: (w: Wonder) => void;
  iss: ISSPosition | null;
}

const CRUISE_KMH = 900;

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return Math.round(n).toString();
}

/** Re-render every `ms` to keep clocks live. */
function useNow(ms: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

type Snap = 'peek' | 'half' | 'full';
const PEEK_PX = 188;
const SPRING = { type: 'spring' as const, stiffness: 420, damping: 42 };

export default function InfoPanel(props: Readonly<InfoPanelProps>) {
  const { mode, point } = props;
  // On phones the panel becomes a draggable bottom sheet with peek/half/full
  // snap points, so the globe stays the hero and tappable. Drag the handle (or
  // tap it) to pull up for detail; drag down to clear more of the globe. Its
  // height is fixed at the fully-expanded size and we translate it down to
  // collapse, so visible height = sheetH − y.
  const isPhone = useMediaQuery('(max-width: 768px)');

  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sheetH = Math.min(vh * 0.82, vh - 140);
  const halfVisible = Math.min(sheetH, vh * 0.52);
  const offsetFor = (s: Snap) => {
    if (s === 'full') return 0;
    return Math.max(0, sheetH - (s === 'half' ? halfVisible : PEEK_PX));
  };

  const [snap, setSnap] = useState<Snap>('peek');
  const y = useMotionValue(sheetH); // start fully tucked away; settle to peek on mount
  const dragControls = useDragControls();

  // A new selection or a mode switch reveals a compact peek (globe stays hero).
  // Adjusting state during render (the React-recommended pattern) instead of in
  // an effect avoids a frame where the sheet sits at the previous snap.
  const selectionKey = `${mode}:${point?.lat ?? ''},${point?.lng ?? ''}`;
  const [lastSelection, setLastSelection] = useState(selectionKey);
  if (selectionKey !== lastSelection) {
    setLastSelection(selectionKey);
    setSnap('peek');
  }

  // Settle the sheet to the active snap whenever the snap or geometry changes.
  useEffect(() => {
    if (!isPhone) return;
    const controls = animate(y, offsetFor(snap), SPRING);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, isPhone, sheetH, halfVisible]);

  const cycleSnap = () => setSnap(s => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.18;
    let best: Snap = 'peek';
    let bestDist = Infinity;
    for (const s of ['full', 'half', 'peek'] as const) {
      const dist = Math.abs(offsetFor(s) - projected);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    }
    if (best === snap) animate(y, offsetFor(best), SPRING);
    else setSnap(best);
  };

  const contentKey = `${mode}-${props.passportCode}-${props.shrinkStage}-${props.flightMode}-${props.compareCodes.join('')}-${props.timelineCode}-${props.route.from.name}${props.route.to.name}-${props.wonder?.id ?? ''}`;

  const className = `info-panel glass${isPhone ? ` sheet ${snap}` : ''}`;

  const entrance = isPhone
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } }
    : {
        initial: { opacity: 0, x: 48, filter: 'blur(6px)' },
        animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, x: 32, filter: 'blur(4px)' },
        transition: { delay: 0.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <motion.aside
      className={className}
      style={isPhone ? { y, height: sheetH } : undefined}
      drag={isPhone ? 'y' : false}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: offsetFor('peek') }}
      dragElastic={0.06}
      dragMomentum={false}
      onDragEnd={isPhone ? handleDragEnd : undefined}
      {...entrance}
    >
      <button
        className="panel-handle"
        type="button"
        onPointerDown={e => isPhone && dragControls.start(e)}
        onClick={() => isPhone && cycleSnap()}
        aria-label={snap === 'full' ? 'Collapse details' : 'Expand details'}
        aria-expanded={snap !== 'peek'}
        tabIndex={isPhone ? 0 : -1}
      >
        <span className="panel-handle-bar" />
      </button>
      {point && <LocationHeader point={point} place={props.place} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={contentKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <PanelBody {...props} />
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}

function PanelBody(props: Readonly<InfoPanelProps>) {
  switch (props.mode) {
    case 'dig':
      return <DigBody point={props.point} place={props.place} />;
    case 'blast':
      return (
        <BlastBody
          point={props.point}
          blastType={props.blastType}
          blastTypes={props.blastTypes}
          onBlastTypeChange={props.onBlastTypeChange}
        />
      );
    case 'truesize':
      return (
        <TrueSizeBody
          shrink={props.shrink}
          stage={props.shrinkStage}
          onAdvance={props.onAdvanceShrink}
          onReset={props.onResetShrink}
        />
      );
    case 'daynight':
      return <DayNightBody point={props.point} />;
    case 'visa':
      return <VisaBody passportCode={props.passportCode} onPassportChange={props.onPassportChange} />;
    case 'flight':
      return (
        <FlightBody
          flightMode={props.flightMode}
          onFlightModeChange={props.onFlightModeChange}
          point={props.point}
          flightHours={props.flightHours}
          onFlightHoursChange={props.onFlightHoursChange}
          route={props.route}
          onRouteChange={props.onRouteChange}
        />
      );
    case 'climatetwin':
      return <ClimateTwinBody point={props.point} />;
    case 'compare':
      return <CompareBody codes={props.compareCodes} onChange={props.onCompareChange} />;
    case 'timeline':
      return (
        <TimelineBody
          timelineCode={props.timelineCode}
          onTimelineChange={props.onTimelineChange}
        />
      );
    case 'population':
      return <PopulationBody />;
    case 'wonders':
      return <WondersBody wonder={props.wonder} onSelect={props.onWonderSelect} />;
    case 'space':
      return <SpaceBody iss={props.iss} />;
  }
}

// ── Shared bits ───────────────────────────────────────────────
function LocationHeader({ point, place }: Readonly<{ point: LatLng; place: PlaceInfo | null }>) {
  const now = useNow(1000);
  const city = getNearestCity(point.lat, point.lng);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingWeather(true);
    fetchWeather(point.lat, point.lng).then(w => {
      if (active) {
        setWeather(w);
        setLoadingWeather(false);
      }
    });
    return () => {
      active = false;
    };
  }, [point.lat, point.lng]);

  // Prefer the precise reverse-geocoded place; fall back to coordinates
  // (never to a far "nearest city", which is what mislabeled NE India).
  const placeLabel = place?.label ?? getLocationLabel(point.lat, point.lng);
  const offset = city?.utcOffset ?? estimateUtcOffset(point.lng);
  const localTime = city
    ? now.toLocaleTimeString('en-US', { timeZone: city.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date(now.getTime() + now.getTimezoneOffset() * 60000 + offset * 3600000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
  const day = isDaylight(point.lat, point.lng, now);

  return (
    <div className="location-chip">
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="panel-title" style={{ fontSize: 15 }}>{placeLabel}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 6 }}>
          <span className="stat-value" style={{ fontSize: 13 }}>{localTime}</span>
          <span className="stat-label" style={{ fontSize: 13 }}>
            {day ? '☀ Day' : '🌙 Night'}
          </span>
          {loadingWeather ? (
            <span className="stat-label" style={{ fontSize: 13 }}>…</span>
          ) : weather ? (
            <span className="stat-label" style={{ fontSize: 13 }}>
              {weather.emoji} {Math.round(weather.tempC)}°C · {weather.label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Title({ children, sub }: Readonly<{ children: React.ReactNode; sub?: string }>) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <p className="panel-title">{children}</p>
      {sub && <p className="panel-sub" style={{ marginTop: '2px' }}>{sub}</p>}
    </div>
  );
}

function Row({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function Placeholder({ text }: Readonly<{ text: string }>) {
  return (
    <p
      style={{
        fontSize: '13px',
        color: 'var(--muted)',
        textAlign: 'center',
        padding: '28px 8px',
        lineHeight: 1.6,
      }}
    >
      {text}
    </p>
  );
}

// ── Existing 5 modes ──────────────────────────────────────────
function DigBody({ point, place }: Readonly<{ point: LatLng | null; place: PlaceInfo | null }>) {
  if (!point) return <><Title sub="Tunnel straight through the planet">Dig</Title><Placeholder text="Click the globe to explore" /></>;
  const antipode = getAntipode(point.lat, point.lng);
  const end = getNearestCity(antipode.lat, antipode.lng);
  const clicked = place?.label ?? getLocationLabel(point.lat, point.lng);
  return (
    <>
      <Title sub="Tunnel straight through the planet">Dig</Title>
      <Row label="You clicked" value={clicked} />
      <Row label="Comes out at" value={end?.name ?? getLocationLabel(antipode.lat, antipode.lng)} />
      {end && <Row label="Country" value={end.country} />}
      <Row label="Through Earth" value="12,742 km" />
    </>
  );
}

function BlastBody({
  point,
  blastType,
  blastTypes,
  onBlastTypeChange,
}: Readonly<{
  point: LatLng | null;
  blastType: BlastType;
  blastTypes: BlastType[];
  onBlastTypeChange: (b: BlastType) => void;
}>) {
  const start = point ? getNearestCity(point.lat, point.lng) : null;
  const pop = point ? getPopulationInRadius(point.lat, point.lng, blastType.radius) : 0;
  const zones = getBlastZones(blastType);
  return (
    <>
      <Title sub="Pick an impactor, then strike the globe">Impact Simulator</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        {blastTypes.map(bt => {
          const active = bt.id === blastType.id;
          return (
            <button
              key={bt.id}
              onClick={() => onBlastTypeChange(bt)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: active ? `1px solid ${bt.color}` : '1px solid transparent',
                background: active ? `${bt.color}22` : 'var(--surface-input)',
                color: active ? 'var(--text-strong)' : 'var(--muted)',
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{bt.emoji}</span>
              <span>{bt.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                {formatEnergy(bt.megatons)}
              </span>
            </button>
          );
        })}
      </div>
      {point ? (
        <>
          <Row label="Impact at" value={start?.name ?? getLocationLabel(point.lat, point.lng)} />
          <Row label="Energy" value={<span style={{ color: blastType.color }}>{formatEnergy(blastType.megatons)} TNT</span>} />
          <Row label="vs Hiroshima" value={`${fmt(hiroshimaEquivalent(blastType.megatons))}×`} />
          <Row label="Crater" value={`${blastType.crater} km wide`} />
          <Row label="Population hit" value={pop > 0 ? fmt(pop) : 'Unpopulated'} />
          <p className="t-label" style={{ marginTop: '12px', marginBottom: '4px' }}>Damage zones</p>
          {[...zones].reverse().map(z => (
            <div className="stat-row" key={z.id}>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                {z.label}
              </span>
              <span className="stat-value">{Math.round(z.radiusKm).toLocaleString()} km</span>
            </div>
          ))}
        </>
      ) : (
        <Placeholder text="Click the globe to detonate" />
      )}
    </>
  );
}

function formatEnergy(mt: number): string {
  if (mt < 1) return `${Math.round(mt * 1000)} kt`;
  if (mt < 1000) return `${mt} Mt`;
  if (mt < 1e6) return `${(mt / 1000).toFixed(1)} Gt`;
  return `${fmt(mt)} Mt`;
}

function CmpRow({ name, ratio }: Readonly<{ name: string; ratio: number }>) {
  const bigger = ratio > 1;
  const pct = Math.min(ratio, 1) * 100;
  const txt = ratio >= 10 || ratio < 0.1 ? ratio.toFixed(1) : ratio.toFixed(2);
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px dotted var(--dotline)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span className="stat-label">{name}</span>
        <span className="stat-value">
          {txt}× <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{bigger ? 'larger' : 'smaller'}</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--surface-input)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: bigger ? 'var(--accent-2)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

function DayNightBody({ point }: Readonly<{ point: LatLng | null }>) {
  const now = useNow(1000);
  const sub = subsolarPoint(now);
  const subCity = getNearestCity(sub.lat, sub.lng, 18);

  const here = point ? getNearestCity(point.lat, point.lng) : null;
  const elevation = point ? solarElevation(point.lat, point.lng, now) : 0;
  const day = elevation > 0;

  return (
    <>
      <Title sub="Live terminator · NASA-style city lights">Day &amp; Night</Title>
      <Row label="UTC time" value={now.toUTCString().split(' ')[4]} />
      <Row label="Your time" value={now.toLocaleTimeString()} />
      <Row label="Sun overhead" value={subCity?.name ?? getLocationLabel(sub.lat, sub.lng)} />
      {point ? (
        <>
          <div style={{ height: '1px', background: 'var(--hairline)', margin: '10px 0' }} />
          <Row label="Here" value={here?.name ?? getLocationLabel(point.lat, point.lng)} />
          <Row
            label="Status"
            value={
              <span style={{ color: day ? '#f5b73d' : '#6c8cff' }}>{day ? '☀️ Daytime' : '🌙 Night'}</span>
            }
          />
          <Row label="Sun elevation" value={`${elevation.toFixed(0)}°`} />
        </>
      ) : (
        <p className="panel-sub" style={{ marginTop: '10px' }}>
          Click anywhere to see if it's day or night there.
        </p>
      )}
    </>
  );
}

// ── Mode 7: Visa-Free World ───────────────────────────────────
function VisaBody({
  passportCode,
  onPassportChange,
}: Readonly<{ passportCode: string; onPassportChange: (code: string) => void }>) {
  const passport = PASSPORT_DATA[passportCode] ?? PASSPORT_LIST[0];
  const s = summarizeVisa(passport.code);
  const rank = passportRank(passport.code);
  return (
    <>
      <Title sub="Where can your passport take you?">Visa-Free World</Title>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <span style={{ fontSize: '34px', lineHeight: 1 }}>{passport.flag}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="panel-title" style={{ fontSize: '16px' }}>{passport.name}</p>
          <p className="t-label" style={{ marginTop: '2px' }}>Tier {s.tier} · Rank #{rank || '—'}</p>
        </div>
      </div>

      <select
        className="el-select"
        value={passport.code}
        onChange={e => onPassportChange(e.target.value)}
        style={{ marginBottom: '14px' }}
        aria-label="Choose passport"
      >
        {PASSPORT_LIST.map(p => (
          <option key={p.code} value={p.code}>
            {p.flag} {p.name}
          </option>
        ))}
      </select>

      <Row
        label="Easy-access destinations"
        value={<span style={{ color: 'var(--visa-free)' }}>{s.score}</span>}
      />

      <p className="t-label" style={{ marginTop: '12px', marginBottom: '4px' }}>By category</p>
      <Row label="🟢 Visa-free / arrival" value={s.visaFree} />
      <Row label="🟡 e-Visa / ETA" value={s.eVisa} />
      <Row label="🔴 Visa required" value={s.visaRequired} />
      <p className="panel-sub" style={{ marginTop: '10px', fontSize: '11px' }}>
        Per-country data from Passport Index ({VISA_DATA_META.updated}). For exploration only — not legal advice.
      </p>
    </>
  );
}

// ── Flight — reach circle + great-circle routes ───────────────
function FlightBody({
  flightMode,
  onFlightModeChange,
  point,
  flightHours,
  onFlightHoursChange,
  route,
  onRouteChange,
}: Readonly<{
  flightMode: FlightMode;
  onFlightModeChange: (m: FlightMode) => void;
  point: LatLng | null;
  flightHours: number;
  onFlightHoursChange: (h: number) => void;
  route: { from: City; to: City };
  onRouteChange: (slot: 'from' | 'to', name: string) => void;
}>) {
  return (
    <>
      <Title sub={flightMode === 'reach' ? 'How far can you fly from here?' : 'Plot a great-circle flight path'}>
        Flight
      </Title>
      <div style={{ display: 'flex', gap: 3, padding: 3, marginBottom: 14, borderRadius: 12, background: 'var(--surface-input)' }}>
        {(['reach', 'route'] as const).map(m => {
          const active = flightMode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onFlightModeChange(m)}
              aria-pressed={active}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 9,
                border: 'none',
                background: active ? 'var(--glass-bg-strong)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'reach' ? 'Reach' : 'Route'}
            </button>
          );
        })}
      </div>
      {flightMode === 'reach' ? (
        <FlightReachBody point={point} flightHours={flightHours} onFlightHoursChange={onFlightHoursChange} />
      ) : (
        <FlightRouteFields route={route} onChange={onRouteChange} />
      )}
    </>
  );
}

function FlightReachBody({
  point,
  flightHours,
  onFlightHoursChange,
}: Readonly<{
  point: LatLng | null;
  flightHours: number;
  onFlightHoursChange: (h: number) => void;
}>) {
  const radiusKm = flightHours * CRUISE_KMH;
  const reachable = point ? getCitiesInRadius(point.lat, point.lng, radiusKm) : [];
  return (
    <>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="stat-label">Flight time</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{flightHours}h</span>
        </div>
        <input
          className="el-range"
          type="range"
          min={1}
          max={24}
          step={1}
          value={flightHours}
          onChange={e => onFlightHoursChange(Number(e.target.value))}
        />
      </div>
      {point ? (
        <>
          <Row label="From" value={getLocationLabel(point.lat, point.lng)} />
          <Row label="Range" value={`${radiusKm.toLocaleString()} km`} />
          <Row label="Reachable cities" value={reachable.length} />
          <p className="stat-label" style={{ marginTop: '12px' }}>Nearest reachable</p>
          {reachable.length > 0 ? (
            reachable.slice(0, 5).map(r => (
              <Row key={r.city.name} label={r.city.name} value={`${Math.round(r.distanceKm)} km`} />
            ))
          ) : (
            <Placeholder text="No major cities in range" />
          )}
        </>
      ) : (
        <Placeholder text="Click the globe to set your origin" />
      )}
    </>
  );
}

// ── Mode 9: Climate Twin ──────────────────────────────────────
function ClimateTwinBody({ point }: Readonly<{ point: LatLng | null }>) {
  const city = point ? getNearestCity(point.lat, point.lng, 25) : null;
  if (!city) {
    return (
      <>
        <Title sub="Find cities that feel like home">Climate Twin</Title>
        <Placeholder text="Click near a city to find its climate twins" />
      </>
    );
  }
  const twins = getClimateTwins(city);
  return (
    <>
      <Title sub={`${city.country} · ${koppenLabel(city.climateZone)}`}>{city.name}</Title>
      <Row label="Avg temp" value={`${city.avgTemp}°C`} />
      <Row label="Rainfall" value={`${city.annualRainfall} mm/yr`} />
      <Row label="Köppen zone" value={city.climateZone} />
      <p className="stat-label" style={{ marginTop: '12px' }}>Climate twins</p>
      {twins.map(t => (
        <Row
          key={t.city.name}
          label={`${t.city.name}, ${t.city.country}`}
          value={<span style={{ color: 'var(--accent-2)' }}>{climateSimilarity(city, t.city)}%</span>}
        />
      ))}
    </>
  );
}

// ── True Size — inspect a country, then drop it on another ────
function TrueSizeBody({
  shrink,
  stage,
  onAdvance,
  onReset,
}: Readonly<{
  shrink: ShrinkState;
  stage: 'source' | 'target';
  onAdvance: () => void;
  onReset: () => void;
}>) {
  const { source, target } = shrink;

  if (!source) {
    return (
      <>
        <Title sub="Real size vs the Mercator lie">True Size</Title>
        <Placeholder text="Click a country to reveal its true size" />
      </>
    );
  }

  const areaInflate = source.lat != null ? mercatorAreaFactor(source.lat) : null;
  const landPct = (source.areaKm2 / EARTH_LAND_AREA) * 100;
  const comparisons = getScaleComparisons(source.areaKm2);
  const ratio = target ? source.areaKm2 / target.areaKm2 : null;

  return (
    <>
      <Title sub="Real size vs the Mercator lie">{source.name}</Title>
      <Row label="True area" value={`${fmt(source.areaKm2)} km²`} />
      <Row label="Share of land" value={`${landPct < 0.1 ? landPct.toFixed(2) : landPct.toFixed(1)}%`} />
      {areaInflate != null && (
        <Row label="On flat maps" value={<span style={{ color: 'var(--accent-2)' }}>{areaInflate.toFixed(1)}× bigger</span>} />
      )}

      {!target && stage === 'source' && (
        <>
          <p className="t-label" style={{ marginTop: '12px', marginBottom: '4px' }}>Compared to</p>
          {comparisons.map(c => (
            <CmpRow key={c.name} name={c.name} ratio={c.ratio} />
          ))}
          <button onClick={onAdvance} className="btn-ghost" style={{ marginTop: '14px' }}>
            Drop it on another country →
          </button>
        </>
      )}

      {!target && stage === 'target' && (
        <p className="panel-sub" style={{ marginTop: '12px', color: 'var(--accent)' }}>
          Now click where you want to drop {source.name}.
        </p>
      )}

      {target && (
        <>
          <div style={{ height: '1px', background: 'var(--hairline)', margin: '10px 0' }} />
          <Row label="Dropped on" value={target.name} />
          <Row label="Their area" value={`${fmt(target.areaKm2)} km²`} />
          {ratio && (
            <p className="panel-sub" style={{ marginTop: '12px', color: 'var(--text)' }}>
              {source.name} is <b>{ratio.toFixed(2)}×</b> the size of {target.name}.
            </p>
          )}
          <button
            onClick={onReset}
            className="btn-gradient"
            style={{ width: '100%', marginTop: '14px', padding: '11px' }}
          >
            Reset
          </button>
        </>
      )}
    </>
  );
}

// ── Number formatters ─────────────────────────────────────────
function fmtPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString();
}
function fmtUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  return `$${n.toLocaleString()}`;
}
function fmtArea(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M km²`;
  return `${Math.round(n).toLocaleString()} km²`;
}

function MetricBar({ value, max, color, text }: Readonly<{ value: number; max: number; color: string; text: string }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--surface-input)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', background: color, borderRadius: 999 }}
        />
      </div>
      <span className="stat-value" style={{ minWidth: 66, textAlign: 'right' }}>{text}</span>
    </div>
  );
}

function Metric({ label, a, b, fmt }: Readonly<{ label: string; a: number; b: number; fmt: (n: number) => string }>) {
  const max = Math.max(a, b, 1);
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px dotted var(--dotline)' }}>
      <p className="t-label" style={{ marginBottom: 2 }}>{label}</p>
      <MetricBar value={a} max={max} color="var(--accent)" text={fmt(a)} />
      <MetricBar value={b} max={max} color="var(--accent-2)" text={fmt(b)} />
    </div>
  );
}

// ── Compare Countries ─────────────────────────────────────────
function Source({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="panel-sub" style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
      {children}
    </p>
  );
}

function CompareBody({
  codes,
  onChange,
}: Readonly<{ codes: [string, string]; onChange: (slot: 0 | 1, code: string) => void }>) {
  const a = getCountryFact(codes[0]);
  const b = getCountryFact(codes[1]);
  return (
    <>
      <Title sub="Two countries, side by side">Compare</Title>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {([0, 1] as const).map(slot => (
          <select
            key={slot}
            className="el-select"
            value={codes[slot]}
            onChange={e => onChange(slot, e.target.value)}
            aria-label={slot === 0 ? 'First country' : 'Second country'}
            style={{ borderColor: slot === 0 ? 'var(--accent)' : 'var(--accent-2)' }}
          >
            {COUNTRY_FACT_LIST.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        ))}
      </div>

      {a && b && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{a.flag} {a.name}</span>
            <span style={{ color: 'var(--accent-2)', fontWeight: 600, fontSize: 13 }}>{b.flag} {b.name}</span>
          </div>
          <Metric label="Population" a={a.population} b={b.population} fmt={fmtPop} />
          <Metric label="Area" a={a.areaKm2} b={b.areaKm2} fmt={fmtArea} />
          <Metric label="GDP (nominal)" a={a.gdpUsd} b={b.gdpUsd} fmt={fmtUsd} />
          <Metric label="Internet users" a={a.internetPct} b={b.internetPct} fmt={n => `${n}%`} />
          <div className="stat-row"><span className="stat-label">Capital</span><span className="stat-value">{a.capital} · {b.capital}</span></div>
          <div className="stat-row"><span className="stat-label">Language</span><span className="stat-value">{a.language} · {b.language}</span></div>
          <Source>Figures: 2023–24 estimates</Source>
        </>
      )}
    </>
  );
}

// ── Flight route fields (rendered inside FlightBody) ──────────
function FlightRouteFields({
  route,
  onChange,
}: Readonly<{ route: { from: City; to: City }; onChange: (slot: 'from' | 'to', name: string) => void }>) {
  const info = getFlightInfo(route.from, route.to);
  const cities = [...CITIES].sort((x, y) => x.name.localeCompare(y.name));
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {(['from', 'to'] as const).map(slot => (
          <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="t-label" style={{ width: 34 }}>{slot === 'from' ? 'From' : 'To'}</span>
            <select
              className="el-select"
              value={route[slot].name}
              onChange={e => onChange(slot, e.target.value)}
              aria-label={slot}
            >
              {cities.map(c => (
                <option key={c.name} value={c.name}>{c.name}, {c.country}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <Row label="Distance" value={`${Math.round(info.distanceKm).toLocaleString()} km`} />
      <Row label="Flight time" value={<span style={{ color: 'var(--accent)' }}>{info.duration}</span>} />
      <Row label="Typical aircraft" value={info.aircraft} />
      <Row label="Great-circle" value={`${(info.distanceKm / 40075 * 100).toFixed(1)}% of Earth`} />
    </>
  );
}

// ── Country Timeline ──────────────────────────────────────────
function fmtTimelineValue(indicator: TimelineIndicator, value: number): string {
  if (indicator === 'gdp') {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (indicator === 'internet') return `${value.toFixed(1)}%`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return Math.round(value).toLocaleString();
}

function TimelineBody({
  timelineCode,
  onTimelineChange,
}: Readonly<{ timelineCode: string; onTimelineChange: (code: string) => void }>) {
  const [indicator, setIndicator] = useState<TimelineIndicator>('population');
  const [points, setPoints] = useState<{ year: number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const country = getCountryFact(timelineCode);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const ind = TIMELINE_INDICATORS[indicator].id;
    fetchCountryTimeline(timelineCode, ind).then(data => {
      if (active) {
        setPoints(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [timelineCode, indicator]);

  const minVal = points.length ? Math.min(...points.map(p => p.value)) : 0;
  const maxVal = points.length ? Math.max(...points.map(p => p.value)) : 1;
  const range = maxVal - minVal || 1;
  const w = 260;
  const h = 72;
  const pad = 4;
  const pathD =
    points.length > 1
      ? points
          .map((p, i) => {
            const x = pad + (i / (points.length - 1)) * (w - pad * 2);
            const y = h - pad - ((p.value - minVal) / range) * (h - pad * 2);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ')
      : '';
  const latest = points.at(-1);
  const first = points[0];
  const growth =
    first && latest && first.value !== 0
      ? (((latest.value - first.value) / first.value) * 100).toFixed(1)
      : null;

  return (
    <>
      <Title sub="World Bank indicators, 1990–2023">Country Timeline</Title>
      <select
        className="el-select"
        value={timelineCode}
        onChange={e => onTimelineChange(e.target.value)}
        style={{ marginBottom: 12 }}
        aria-label="Choose country"
      >
        {COUNTRY_FACT_LIST.map(c => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(Object.keys(TIMELINE_INDICATORS) as TimelineIndicator[]).map(key => {
          const active = indicator === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setIndicator(key)}
              style={{
                flex: 1,
                minWidth: 80,
                padding: '7px 8px',
                borderRadius: 10,
                border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                background: active ? 'var(--accent-soft)' : 'var(--surface-input)',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-display)',
                fontSize: 11.5,
                fontWeight: 550,
                cursor: 'pointer',
              }}
            >
              {TIMELINE_INDICATORS[key].label}
            </button>
          );
        })}
      </div>
      {loading ? (
        <Placeholder text="Loading timeline…" />
      ) : points.length === 0 ? (
        <Placeholder text="No data for this country" />
      ) : (
        <>
          <svg className="timeline-chart" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden>
            <motion.path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="t-label">{points[0]?.year}</span>
            <span className="t-label">{latest?.year}</span>
          </div>
          {latest && (
            <Row
              label={`Latest (${latest.year})`}
              value={
                <span style={{ color: 'var(--accent)' }}>
                  {fmtTimelineValue(indicator, latest.value)}
                </span>
              }
            />
          )}
          {growth != null && first && latest && (
            <Row
              label={`${first.year} → ${latest.year}`}
              value={
                <span style={{ color: Number(growth) >= 0 ? 'var(--visa-free)' : 'var(--visa-required)' }}>
                  {Number(growth) >= 0 ? '+' : ''}{growth}%
                </span>
              }
            />
          )}
          {country && <p className="panel-sub" style={{ marginTop: 8 }}>{country.flag} {country.name}</p>}
          <Source>Source: World Bank · 1990–latest</Source>
        </>
      )}
    </>
  );
}

// ── Population Density ────────────────────────────────────────
function PopulationBody() {
  const top5 = [...COUNTRY_FACTS]
    .map(f => ({ fact: f, density: countryDensity(f) }))
    .sort((a, b) => b.density - a.density)
    .slice(0, 5);

  return (
    <>
      <Title sub="People per km² by country">Population Density</Title>
      <p className="panel-sub" style={{ marginBottom: 12 }}>
        Countries are coloured on the globe by population divided by land area. Hover a country for its density.
      </p>
      <p className="t-label" style={{ marginBottom: 6 }}>Legend</p>
      {DENSITY_BINS.map(bin => (
        <div key={bin.label} className="stat-row" style={{ padding: '5px 0' }}>
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: bin.color, flexShrink: 0 }} />
            {bin.label}
          </span>
        </div>
      ))}
      <p className="t-label" style={{ marginTop: 12, marginBottom: 4 }}>Top 5 densest</p>
      {top5.map(({ fact, density }) => (
        <Row
          key={fact.code}
          label={`${fact.flag} ${fact.name}`}
          value={<span style={{ color: densityColor(density) }}>{Math.round(density).toLocaleString()} / km²</span>}
        />
      ))}
      <Source>Population &amp; area: 2023–24 estimates</Source>
    </>
  );
}

// ── Natural Wonders ───────────────────────────────────────────
function WondersBody({ wonder, onSelect }: Readonly<{ wonder: Wonder | null; onSelect: (w: Wonder) => void }>) {
  return (
    <>
      <Title sub="Tap a wonder to fly there">Natural Wonders</Title>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: wonder ? 14 : 0 }}>
        {NATURAL_WONDERS.map(w => {
          const active = wonder?.id === w.id;
          return (
            <button
              key={w.id}
              type="button"
              aria-label={`${w.name}, ${w.country}`}
              aria-pressed={active}
              onClick={() => onSelect(w)}
              style={{
                padding: '7px 11px',
                borderRadius: 999,
                cursor: 'pointer',
                border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                background: active ? 'var(--accent-soft)' : 'var(--surface-input)',
                color: active ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 550,
              }}
            >
              {w.emoji} {w.name}
            </button>
          );
        })}
      </div>
      {wonder && (
        <>
          <div className="wonder-card" style={{ background: wonder.gradient }}>
            <span className="wonder-card-emoji">{wonder.emoji}</span>
            <div className="wonder-card-title">
              <p className="panel-title" style={{ fontSize: 17, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
                {wonder.name}
              </p>
              <p className="t-label" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                {wonder.country}
              </p>
            </div>
          </div>
          <p className="panel-sub" style={{ margin: '10px 0' }}>{wonder.blurb}</p>
          <Row label={wonder.statLabel} value={<span style={{ color: 'var(--accent)' }}>{wonder.stat}</span>} />
        </>
      )}
    </>
  );
}

// ── Space View ────────────────────────────────────────────────
function SpaceBody({ iss }: Readonly<{ iss: ISSPosition | null }>) {
  return (
    <>
      <Title sub="Earth from orbit — Moon & ISS">Space View</Title>
      <p className="panel-sub" style={{ marginBottom: 12 }}>
        The camera pulls back past the atmosphere to reveal the Moon's orbit and the
        live position of the International Space Station.
      </p>
      {iss ? (
        <>
          <p className="t-label" style={{ marginBottom: 4 }}>🛰 ISS — live</p>
          <Row label="Latitude" value={`${iss.lat.toFixed(2)}°`} />
          <Row label="Longitude" value={`${iss.lng.toFixed(2)}°`} />
          <Row label="Altitude" value={`${Math.round(iss.altitudeKm)} km`} />
          <Row label="Speed" value={`${Math.round(iss.velocityKmh).toLocaleString()} km/h`} />
        </>
      ) : (
        <Placeholder text="Locating the ISS…" />
      )}
    </>
  );
}
