import { useMemo, useState } from "react";
import type { Airport, Airline, LegInput } from "../api";
import { Combobox, type ComboOption } from "./Combobox";

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

export function LegsBuilder({
  airports,
  airlines,
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
          a.country ?? "",
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

  function update(i: number, patch: Partial<LegInput>) {
    const next = legs.slice();
    next[i] = { ...next[i], ...patch };
    setLegs(next);
  }
  function add() {
    const last = legs[legs.length - 1];
    setLegs([
      ...legs,
      { src: last ? last.dst : "", dst: "", airline: "" },
    ]);
  }
  function remove(i: number) {
    setLegs(legs.filter((_, idx) => idx !== i));
  }

  return (
    <div className="legs panel">
      <div className="label">Build your routing</div>
      {legs.length === 0 && (
        <div style={{ color: "var(--color-text-dim)", fontSize: 14 }}>
          Add at least two legs that connect the two airports above.
        </div>
      )}
      {legs.map((leg, i) => (
        <LegRow
          key={i}
          idx={i}
          leg={leg}
          airportOpts={airportOpts}
          airlineOpts={airlineOpts}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
          disabled={disabled}
        />
      ))}
      <div className="legs__actions">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
        >
          + Add leg
        </button>
      </div>
    </div>
  );
}

function LegRow({
  idx,
  leg,
  airportOpts,
  airlineOpts,
  onChange,
  onRemove,
  disabled,
}: {
  idx: number;
  leg: LegInput;
  airportOpts: ComboOption[];
  airlineOpts: ComboOption[];
  onChange: (patch: Partial<LegInput>) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [, setSrc] = useState(leg.src);
  const [, setDst] = useState(leg.dst);
  const [, setAirline] = useState(leg.airline);
  return (
    <div className="legs__row">
      <div className="legs__idx">{idx + 1}</div>
      <Combobox
        options={airportOpts}
        value={leg.src}
        onChange={(v) => {
          setSrc(v.toUpperCase());
          onChange({ src: v.toUpperCase() });
        }}
        placeholder="From (e.g. LHR)"
        ariaLabel={`Leg ${idx + 1} from`}
      />
      <span className="legs__arrow">→</span>
      <Combobox
        options={airportOpts}
        value={leg.dst}
        onChange={(v) => {
          setDst(v.toUpperCase());
          onChange({ dst: v.toUpperCase() });
        }}
        placeholder="To (e.g. MAD)"
        ariaLabel={`Leg ${idx + 1} to`}
      />
      <Combobox
        options={airlineOpts}
        value={leg.airline}
        onChange={(v) => {
          setAirline(v.toUpperCase());
          onChange({ airline: v.toUpperCase() });
        }}
        placeholder="Airline (e.g. IB)"
        ariaLabel={`Leg ${idx + 1} airline`}
      />
      <button
        type="button"
        className="legs__remove"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove leg ${idx + 1}`}
        title="Remove leg"
      >
        ×
      </button>
    </div>
  );
}
