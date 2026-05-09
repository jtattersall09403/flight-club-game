import { useEffect, useState } from "react";
import { api, type Airline, type Airport, type Mode } from "./api";
import { LandingPage } from "./components/LandingPage";
import { GamePage } from "./components/GamePage";

type Screen =
  | { kind: "landing" }
  | { kind: "loading" }
  | { kind: "game"; username: string; mode: Mode };

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: "landing" });
  const [airports, setAirports] = useState<Airport[] | null>(null);
  const [airlines, setAirlines] = useState<Airline[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-load catalogs once.
  useEffect(() => {
    Promise.all([api.airports(), api.airlines()])
      .then(([ap, al]) => {
        setAirports(ap);
        setAirlines(al);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div className="landing">
        <div className="panel landing__inner">
          <h2>Backend offline</h2>
          <p className="error-text">{error}</p>
          <p style={{ color: "var(--color-text-dim)" }}>
            Start the API with{" "}
            <code>uvicorn app.server:app --port 8765</code> and refresh.
          </p>
        </div>
      </div>
    );
  }

  if (screen.kind === "landing") {
    return (
      <LandingPage
        onStart={(username, mode) =>
          setScreen({ kind: "game", username, mode })
        }
      />
    );
  }

  if (screen.kind === "game") {
    if (!airports || !airlines) {
      return (
        <div className="landing">
          <div className="panel landing__inner">
            <h2>Loading flight data…</h2>
          </div>
        </div>
      );
    }
    return (
      <GamePage
        username={screen.username}
        mode={screen.mode}
        airports={airports}
        airlines={airlines}
        onExit={() => setScreen({ kind: "landing" })}
      />
    );
  }

  return null;
}
