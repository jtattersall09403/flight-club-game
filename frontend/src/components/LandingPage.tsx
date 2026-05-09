import { useState } from "react";
import type { Mode } from "../api";

interface Props {
  onStart: (username: string, mode: Mode) => void;
}

export function LandingPage({ onStart }: Props) {
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<Mode>("normal");

  return (
    <div className="landing">
      <div className="panel landing__inner">
        <h1 className="landing__title">JACK'S FLIGHT CLUB</h1>
        <p className="landing__sub">
          Connect the dots. Stick to the alliance. Don't crash and burn.
        </p>
        <form
          className="landing__form"
          onSubmit={(e) => {
            e.preventDefault();
            const name = username.trim();
            if (name.length === 0) return;
            onStart(name, mode);
          }}
        >
          <div>
            <div className="label" style={{ textAlign: "left", marginBottom: 6 }}>
              Your name
            </div>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              maxLength={32}
            />
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
            disabled={username.trim().length === 0}
            style={{ marginTop: 8, fontSize: 16 }}
          >
            ▸ Go
          </button>
        </form>
      </div>
    </div>
  );
}
