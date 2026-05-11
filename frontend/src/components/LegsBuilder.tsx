import { useEffect, useMemo, useState } from "react";
import type { Airport, Airline, LegInput } from "../api";
import type { ComboOption } from "./Combobox";

interface Props {
  airports: Airport[];
  airlines: Airline[];
  /** Question's required endpoints — first leg starts at one of these,
   *  last leg ends at the other. */
  endpoints: { a: string; b: string };
  legs: LegInput[];
  setLegs: (legs: LegInput[]) => void;
  disabled?: boolean;
}

interface PickerState {
  type: "airport" | "airline";
  index: number;
}

export function LegsBuilder({
  airports,
  airlines,
  endpoints,
  legs,
  setLegs,
  disabled,
}: Props) {
  const airportOpts: ComboOption[] = useMemo(
    () =>
      airports.map((a) => ({
        value: a.iata,
        label: a.iata,
        meta: [a.name, a.city, a.country].filter(Boolean).join(", "),
        searchKey: [
          a.iata,
          a.name ?? "",
          a.city ?? "",
        ]
          .join(" ")
          .toLowerCase(),
      })),
    [airports],
  );

  const airlineOpts: ComboOption[] = useMemo(
    () =>
      airlines.map((a) => ({
        value: a.iata,
        label: a.iata,
        meta: a.name,
        searchKey: `${a.iata} ${a.name}`.toLowerCase(),
      })),
    [airlines],
  );

  const airportMap = useMemo(
    () => new Map(airportOpts.map((o) => [o.value, o])),
    [airportOpts],
  );
  const airlineMap = useMemo(
    () => new Map(airlineOpts.map((o) => [o.value, o])),
    [airlineOpts],
  );

  const path = derivePathFromLegs(legs, endpoints);
  const [picker, setPicker] = useState<PickerState | null>(null);

  function commitPath(nextPath: string[], nextAirlines: string[]) {
    const nextLegs: LegInput[] = [];
    for (let i = 0; i < nextPath.length - 1; i += 1) {
      nextLegs.push({
        src: nextPath[i],
        dst: nextPath[i + 1],
        airline: nextAirlines[i] ?? "",
      });
    }
    setLegs(nextLegs);
  }

  function updateStopover(pathIndex: number, airportCode: string) {
    const nextPath = path.slice();
    nextPath[pathIndex] = airportCode.toUpperCase();
    commitPath(nextPath, legs.map((l) => l.airline));
  }

  function insertStopover() {
    const insertIndex = path.length - 1;
    const nextPath = [...path.slice(0, insertIndex), "", ...path.slice(insertIndex)];
    const airlinesBySegment = legs.map((l) => l.airline);
    const oldAirline = airlinesBySegment[insertIndex - 1] ?? "";
    const nextAirlines = [
      ...airlinesBySegment.slice(0, insertIndex - 1),
      oldAirline,
      "",
      ...airlinesBySegment.slice(insertIndex),
    ];
    commitPath(nextPath, nextAirlines);
  }

  function removeStopover(pathIndex: number) {
    if (pathIndex <= 0 || pathIndex >= path.length - 1) return;
    const nextPath = path.filter((_, i) => i !== pathIndex);
    const airlinesBySegment = legs.map((l) => l.airline);
    const keptAirline = airlinesBySegment[pathIndex - 1] ?? "";
    const nextAirlines = [
      ...airlinesBySegment.slice(0, pathIndex - 1),
      keptAirline,
      ...airlinesBySegment.slice(pathIndex + 1),
    ];
    commitPath(nextPath, nextAirlines);
  }

  function updateAirline(segmentIndex: number, airlineCode: string) {
    const nextLegs = legs.slice();
    if (!nextLegs[segmentIndex]) return;
    nextLegs[segmentIndex] = {
      ...nextLegs[segmentIndex],
      airline: airlineCode.toUpperCase(),
    };
    setLegs(nextLegs);
  }

  return (
    <div className="legs panel">
      <div className="label">Build your flight plan</div>
      <div className="flight-plan">
        {path.map((code, nodeIndex) => {
          const airport = airportMap.get(code);
          const isEndpoint = nodeIndex === 0 || nodeIndex === path.length - 1;
          const isEmptyStopover = !isEndpoint && !code;

          return (
            <div key={`node-${nodeIndex}`}>
              {nodeIndex === path.length - 1 && (
                <div className="legs__actions legs__actions--inline">
                  <button type="button" onClick={insertStopover} disabled={disabled}>
                    + Add another stop
                  </button>
                </div>
              )}
              <button
                type="button"
                className={`flight-plan__node ${
                  isEndpoint
                    ? "flight-plan__node--endpoint"
                    : isEmptyStopover
                      ? "flight-plan__node--empty"
                      : "flight-plan__node--stopover"
                }`}
                disabled={disabled || isEndpoint}
                onClick={() => !isEndpoint && setPicker({ type: "airport", index: nodeIndex })}
                aria-label={
                  isEndpoint
                    ? `${nodeIndex === 0 ? "Start" : "End"} airport ${code}`
                    : code
                      ? `Change stopover ${code}`
                      : "Add stopover"
                }
              >
                {isEmptyStopover ? (
                  <>
                    <span className="flight-plan__iata">+ Add stopover</span>
                    <span className="flight-plan__meta">Search airport</span>
                  </>
                ) : (
                  <>
                    <span className="flight-plan__iata">{code || "---"}</span>
                    {airport?.meta && <span className="flight-plan__meta">{airport.meta}</span>}
                  </>
                )}
              </button>

              {!isEndpoint && code && !disabled && (
                <button
                  type="button"
                  className="flight-plan__remove-stop"
                  aria-label={`Remove stopover ${code}`}
                  onClick={() => removeStopover(nodeIndex)}
                >
                  Remove stop
                </button>
              )}

              {nodeIndex < path.length - 1 && (
                <div className="flight-plan__segment">
                  <div className="flight-plan__line">
                    <span className="flight-plan__plane" aria-hidden="true">✈</span>
                  </div>
                  <button
                    type="button"
                    className={`flight-plan__airline-pill ${!legs[nodeIndex]?.airline ? "is-empty" : ""}`}
                    disabled={disabled}
                    onClick={() => setPicker({ type: "airline", index: nodeIndex })}
                    aria-label={`Select airline for segment ${nodeIndex + 1}`}
                  >
                    {legs[nodeIndex]?.airline
                      ? (
                        <>
                          <span>{legs[nodeIndex].airline}</span>
                          <small>{airlineMap.get(legs[nodeIndex].airline)?.meta ?? ""}</small>
                        </>
                        )
                      : "Select airline"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {picker && (
        <PickerSheet
          title={picker.type === "airport" ? "Select stopover airport" : "Select airline"}
          options={picker.type === "airport" ? airportOpts : airlineOpts}
          value={
            picker.type === "airport"
              ? path[picker.index] ?? ""
              : legs[picker.index]?.airline ?? ""
          }
          placeholder={picker.type === "airport" ? "Search airport" : "Search airline"}
          onClose={() => setPicker(null)}
          onSelect={(v) => {
            if (picker.type === "airport") {
              updateStopover(picker.index, v);
            } else {
              updateAirline(picker.index, v);
            }
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function derivePathFromLegs(legs: LegInput[], endpoints: { a: string; b: string }) {
  if (legs.length === 0) return [endpoints.a, "", endpoints.b];
  const path = [legs[0]?.src || endpoints.a];
  for (const leg of legs) path.push(leg.dst || "");
  path[0] = endpoints.a;
  path[path.length - 1] = endpoints.b;
  return path;
}

function PickerSheet({
  title,
  options,
  value,
  placeholder,
  onSelect,
  onClose,
}: {
  title: string;
  options: ComboOption[];
  value: string;
  placeholder: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 100);

    const exact: ComboOption[] = [];
    const prefix: ComboOption[] = [];
    const contains: ComboOption[] = [];

    for (const o of options) {
      const label = o.label.toLowerCase();
      if (label === q) exact.push(o);
      else if (label.startsWith(q)) prefix.push(o);
      else if (o.searchKey.includes(q)) contains.push(o);

      if (exact.length + prefix.length + contains.length >= 200) break;
    }

    return [...exact, ...prefix, ...contains].slice(0, 100);
  }, [options, query]);

  return (
    <div className="picker-backdrop" onMouseDown={onClose}>
      <div className="picker panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="picker__title">{title}</div>
        <input
          className="picker__search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="picker__list" role="listbox">
          {filtered.map((opt) => (
            <button key={opt.value} type="button" className="picker__option" onClick={() => onSelect(opt.value)}>
              <span className="picker__option-iata">{opt.label}</span>
              {opt.meta && <span className="picker__option-meta">{opt.meta}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
