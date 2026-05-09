import { useEffect, useRef, useState } from "react";
import { api, type Mode } from "../api";
import { Leaderboard } from "./Leaderboard";

interface Props {
  onStart: (username: string, mode: Mode) => void;
}

export function LandingPage({ onStart }: Props) {
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<Mode>("normal");
  const [matches, setMatches] = useState<string[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const matchTimer = useRef<number | null>(null);

  // Debounced lookup of existing names that share a prefix.
  useEffect(() => {
    const q = username.trim();
    if (q.length < 1) {
      setMatches([]);
      return;
    }
    if (matchTimer.current) window.clearTimeout(matchTimer.current);
    matchTimer.current = window.setTimeout(() => {
      api
        .leaderboardNames(q)
        .then((r) => setMatches(r.names))
        .catch(() => setMatches([]));
    }, 180);
    return () => {
      if (matchTimer.current) window.clearTimeout(matchTimer.current);
    };
  }, [username]);

  const trimmed = username.trim();
  const exactMatch = matches.some(
    (m) => m.toLowerCase() === trimmed.toLowerCase(),
  );

  return (
    <div className="landing">
      <div className="panel landing__inner">
        <h1 className="landing__title">JACK'S FLIGHT CLUB</h1>
        <p className="landing__sub">
          An aviation routing puzzle. You're given two airports and an
          alliance — work out a multi-leg connection on member airlines.
          Clear all 10 levels without a wrong answer to top the board.
        </p>
        <form
          className="landing__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed.length === 0) return;
            onStart(trimmed, mode);
          }}
        >
          <div style={{ position: "relative" }}>
            <div className="label" style={{ textAlign: "left", marginBottom: 6 }}>
              Your name
            </div>
            <input
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setShowMatches(true);
              }}
              onFocus={() => setShowMatches(true)}
              onBlur={() => {
                window.setTimeout(() => setShowMatches(false), 150);
              }}
              placeholder="e.g. Maverick"
              maxLength={24}
              autoComplete="off"
            />
            {showMatches && matches.length > 0 && (
              <ul className="combobox__list" role="listbox">
                {matches.map((m) => (
                  <li
                    key={m}
                    className="combobox__option"
                    role="option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setUsername(m);
                      setShowMatches(false);
                    }}
                  >
                    <span className="combobox__opt-iata">{m}</span>
                    <span className="combobox__opt-meta">existing pilot</span>
                  </li>
                ))}
              </ul>
            )}
            {trimmed && exactMatch && (
              <div className="landing__hint" style={{ marginTop: 6 }}>
                Continuing as <strong>{trimmed}</strong>. If that's not you,
                choose a different name.
              </div>
            )}
          </div>

          <div>
            <div className="label" style={{ textAlign: "left", marginBottom: 6 }}>
              Mode
            </div>
            <div className="mode-toggle">
              <button
                type="button"
                className="mode-toggle__btn"
                aria-pressed={mode === "normal"}
                onClick={() => setMode("normal")}
              >
                Normal
              </button>
              <button
                type="button"
                className="mode-toggle__btn"
                aria-pressed={mode === "hard"}
                onClick={() => setMode("hard")}
              >
                Hard (IATA only)
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="primary"
            disabled={trimmed.length === 0}
            style={{ marginTop: 8, fontSize: 16 }}
          >
            ▸ Go
          </button>
        </form>
      </div>

      <div className="landing__board">
        <Leaderboard initialMode={mode} highlightName={trimmed} />
      </div>
    </div>
  );
}
