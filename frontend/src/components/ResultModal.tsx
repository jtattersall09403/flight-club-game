import { useMemo, useState } from "react";
import type { Mode, Question, ResolvedLeg, RouteSummary, ValidateResult } from "../api";
import { WorldMap } from "./WorldMap";
import { Leaderboard } from "./Leaderboard";

interface Props {
  question: Question;
  result: ValidateResult;
  /** Top-K valid routings by fewest stops, then distance. Only present on
   *  incorrect answers. */
  routes?: RouteSummary[];
  totalScore: number;
  isGameOver: boolean;
  /** Player name + mode, used to highlight their row on the post-game board. */
  username: string;
  mode: Mode;
  onClose: () => void;
}

export function ResultModal({
  question,
  result,
  routes,
  totalScore,
  isGameOver,
  username,
  mode,
  onClose,
}: Props) {
  const correct = result.valid;
  const [selectedRoute, setSelectedRoute] = useState(0);

  const sortedRoutes = useMemo(() => routes?.slice(0, 10), [routes]);

  const endpoints = [
    { iata: question.a, lat: question.a_lat, lon: question.a_lon },
    { iata: question.b, lat: question.b_lat, lon: question.b_lon },
  ];

  let mapLegs: ResolvedLeg[];
  if (correct) {
    mapLegs = result.legs;
  } else if (sortedRoutes && sortedRoutes.length > 0) {
    mapLegs = sortedRoutes[selectedRoute]?.legs ?? sortedRoutes[0].legs;
  } else {
    // Fallback: show the user's submitted (broken) routing so the map at
    // least renders something useful.
    mapLegs = result.legs;
  }

  // Show leaderboard whenever this run ended (won the whole thing or lost).
  const finalScreen = isGameOver || (correct && question.level >= 10);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 24,
          }}
        >
          <h2 className={`modal__title ${correct ? "good" : "bad"}`}>
            {correct ? "Cleared for landing" : "Negative — invalid routing"}
          </h2>
          {correct && (
            <div className="modal__pts">
              +{result.points} pts (total {totalScore})
            </div>
          )}
          {!correct && isGameOver && (
            <div className="modal__pts">Final score: {totalScore}</div>
          )}
        </div>

        {!correct && result.reason && (
          <div className="error-text">{result.reason}</div>
        )}

        <div className="label">
          {correct
            ? `Your routing — ${result.stops} stop${result.stops === 1 ? "" : "s"} (min ${result.min_stops})`
            : sortedRoutes && sortedRoutes.length > 0
              ? selectedRoute === 0
                ? "Valid routing with minimum stops (shortest among ties)"
                : `Routing #${selectedRoute + 1} by stops, then distance`
              : "Your routing"}
        </div>

        <WorldMap endpoints={endpoints} legs={mapLegs} />

        <div className="modal__legs">
          {mapLegs.map((l, i) => (
            <div key={i}>
              <strong>Leg {i + 1}</strong>
              {l.src} → {l.dst} on{" "}
              <span style={{ color: "var(--color-accent)" }}>
                {l.airline}
                {l.airline_name ? ` (${l.airline_name})` : ""}
              </span>
            </div>
          ))}
        </div>

        {!correct && sortedRoutes && sortedRoutes.length > 0 && (
          <RoutesTable
            routes={sortedRoutes}
            selected={selectedRoute}
            onSelect={setSelectedRoute}
          />
        )}

        {finalScreen && (
          <Leaderboard
            initialMode={mode}
            highlightName={username}
            title="Leaderboard — your run is in"
          />
        )}

        <div className="modal__actions">
          {correct ? (
            <button className="primary" onClick={onClose}>
              {question.level >= 10 ? "View final score" : "Next question →"}
            </button>
          ) : (
            <button className="primary" onClick={onClose}>
              Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoutesTable({
  routes,
  selected,
  onSelect,
}: {
  routes: RouteSummary[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const fmtKm = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="routes-table">
      <div className="label">
        Top {routes.length} valid routings — click a row to plot it
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Routing</th>
            <th>Stops</th>
            <th style={{ textAlign: "right" }}>Distance</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r, i) => (
            <tr
              key={i}
              className={i === selected ? "is-selected" : ""}
              onClick={() => onSelect(i)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
            >
              <td>{i + 1}</td>
              <td>
                <span className="route-path">{r.path.join(" → ")}</span>
                <span className="route-airlines">
                  {r.legs.map((l) => l.airline).join(" · ")}
                </span>
              </td>
              <td>{r.stops}</td>
              <td style={{ textAlign: "right" }}>{fmtKm(r.total_km)} km</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
