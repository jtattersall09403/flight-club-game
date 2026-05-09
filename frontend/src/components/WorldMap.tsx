import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import type { ResolvedLeg } from "../api";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Endpoint {
  iata: string;
  lat: number | null;
  lon: number | null;
}

interface Props {
  endpoints: Endpoint[];
  legs: ResolvedLeg[];
  height?: number;
  strokeColor?: string;
}

const MAP_W = 900;

/**
 * Compute a sensible projection centre and scale to fit all points.
 * Handles antimeridian wrap by trying both signed and shifted lon ranges and
 * taking the smaller.
 */
function fitProjection(
  points: Array<[number, number]>,
  height: number,
): { center: [number, number]; scale: number } {
  if (points.length === 0) return { center: [0, 20], scale: 155 };

  const lats = points.map((p) => p[1]);
  const lonsRaw = points.map((p) => p[0]);
  const shifted = lonsRaw.map((l) => (l < 0 ? l + 360 : l));

  function span(arr: number[]): { min: number; max: number; size: number } {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { min, max, size: max - min };
  }
  const a = span(lonsRaw);
  const b = span(shifted);
  const useShifted = b.size < a.size;
  const lonSpan = useShifted ? b : a;
  let centerLon = (lonSpan.min + lonSpan.max) / 2;
  if (useShifted && centerLon > 180) centerLon -= 360;

  const latSpan = span(lats);
  const centerLat = (latSpan.min + latSpan.max) / 2;

  // Add 30% padding around the bbox so points aren't on the edge.
  const padFactor = 1.3;
  const lonExtent = Math.max(lonSpan.size, 4) * padFactor;
  const latExtent = Math.max(latSpan.size, 4) * padFactor;

  // geoEqualEarth at scale 155 puts ~360° lon across ~900px and ~180° lat
  // across ~440px. We approximate px-per-deg as 2.5 for both axes.
  const PX_PER_DEG_AT_155 = 2.5;
  const scaleByLon = (MAP_W / (lonExtent * PX_PER_DEG_AT_155)) * 155;
  const scaleByLat = (height / (latExtent * PX_PER_DEG_AT_155)) * 155;
  let scale = Math.min(scaleByLon, scaleByLat);
  // Clamp to avoid hyper-zoomed views that hide the points off the visible
  // viewport on extreme aspect ratios.
  scale = Math.max(155, Math.min(scale, 1200));

  return { center: [centerLon, centerLat], scale };
}

export function WorldMap({
  endpoints,
  legs,
  height = 380,
  strokeColor = "var(--color-accent)",
}: Props) {
  const drawableLegs = legs.filter(
    (l) =>
      l.src_lat != null &&
      l.src_lon != null &&
      l.dst_lat != null &&
      l.dst_lon != null,
  );

  // Stable signature for the projection memo: avoid recomputing (and thereby
  // remounting ComposableMap, which would refetch the world TopoJSON) when the
  // parent re-renders with a new array reference but identical coordinates.
  const ptsKey = [
    ...endpoints.map((e) => `${e.lat},${e.lon}`),
    ...drawableLegs.map(
      (l) => `${l.src_lat},${l.src_lon}>${l.dst_lat},${l.dst_lon}`,
    ),
  ].join("|");

  const { center, scale } = useMemo(() => {
    const pts: Array<[number, number]> = [];
    for (const e of endpoints) {
      if (e.lat != null && e.lon != null) pts.push([e.lon, e.lat]);
    }
    for (const l of drawableLegs) {
      pts.push([l.src_lon as number, l.src_lat as number]);
      pts.push([l.dst_lon as number, l.dst_lat as number]);
    }
    return fitProjection(pts, height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptsKey, height]);

  // Stable projectionConfig reference so react-simple-maps doesn't re-project
  // (and lose the rendered map) on every parent re-render.
  const projectionConfig = useMemo(
    () => ({ scale, center }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scale, center[0], center[1]],
  );

  return (
    <div className="modal__map" style={{ height }}>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={projectionConfig}
        width={MAP_W}
        height={height}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: "rgba(74,215,255,0.05)",
                    stroke: "rgba(74,215,255,0.25)",
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  hover: { fill: "rgba(74,215,255,0.05)", outline: "none" },
                  pressed: { fill: "rgba(74,215,255,0.05)", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {drawableLegs.map((l, i) => (
          <Line
            key={i}
            from={[l.src_lon as number, l.src_lat as number]}
            to={[l.dst_lon as number, l.dst_lat as number]}
            stroke={strokeColor}
            strokeWidth={1.6}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(74,215,255,0.7))" }}
          />
        ))}

        {endpoints
          .filter((e) => e.lat != null && e.lon != null)
          .map((e) => (
            <Marker
              key={`ep-${e.iata}`}
              coordinates={[e.lon as number, e.lat as number]}
            >
              <circle
                r={5}
                fill="var(--color-accent)"
                stroke="#fff"
                strokeWidth={1}
                style={{ filter: "drop-shadow(0 0 6px rgba(74,215,255,0.9))" }}
              />
              <text
                y={-10}
                textAnchor="middle"
                style={{
                  fill: "var(--color-text)",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textShadow: "0 0 4px rgba(0,0,0,0.9)",
                }}
              >
                {e.iata}
              </text>
            </Marker>
          ))}

        {drawableLegs.flatMap((l, i) => [
          <Marker
            key={`s-${i}`}
            coordinates={[l.src_lon as number, l.src_lat as number]}
          >
            <circle r={2.5} fill="var(--color-accent-2)" />
          </Marker>,
          <Marker
            key={`d-${i}`}
            coordinates={[l.dst_lon as number, l.dst_lat as number]}
          >
            <circle r={2.5} fill="var(--color-accent-2)" />
          </Marker>,
        ])}
      </ComposableMap>
    </div>
  );
}
