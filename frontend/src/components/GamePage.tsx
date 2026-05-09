import { useEffect, useMemo, useState } from "react";
import {
  api,
  type Airline,
  type Airport,
  type HintResult,
  type LegInput,
  type Mode,
  type Question,
  type RoutesResult,
  type ValidateResult,
} from "../api";
import { LegsBuilder } from "./LegsBuilder";
import { ResultModal } from "./ResultModal";

interface Props {
  username: string;
  mode: Mode;
  airports: Airport[];
  airlines: Airline[];
  onExit: () => void;
}

export function GamePage({
  username,
  mode,
  airports,
  airlines,
  onExit,
}: Props) {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [legs, setLegs] = useState<LegInput[]>([]);
  const [hint, setHint] = useState<HintResult | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [routes, setRoutes] = useState<RoutesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);

  // Fetch a new question whenever the level changes.
  useEffect(() => {
    let alive = true;
    setLoadingQ(true);
    setError(null);
    setHint(null);
    setHintUsed(false);
    setResult(null);
    setRoutes(null);
    api
      .question(level, mode)
      .then((q) => {
        if (!alive) return;
        setQuestion(q);
        // Seed two empty legs starting at A.
        setLegs([
          { src: q.a, dst: "", airline: "" },
          { src: "", dst: q.b, airline: "" },
        ]);
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoadingQ(false));
    return () => {
      alive = false;
    };
  }, [level, mode]);

  const isComplete = useMemo(
    () =>
      legs.length >= 2 &&
      legs.every(
        (l) => l.src.length === 3 && l.dst.length === 3 && l.airline.length >= 2,
      ),
    [legs],
  );

  async function onSubmit() {
    if (!question || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.validate({
        group_id: question.group_id,
        a: question.a,
        b: question.b,
        mode,
        legs,
        hint_used: hintUsed,
        level,
      });
      setResult(r);
      if (r.valid) {
        setScore((s) => s + r.points);
      } else {
        // Fetch the K shortest valid routings so the player can study them.
        try {
          const rr = await api.routes({
            group_id: question.group_id,
            a: question.a,
            b: question.b,
            mode,
            k: 11,
          });
          setRoutes(rr);
        } catch {
          // map will just show the user's submitted (broken) routing.
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function onHint() {
    if (!question || hintUsed) return;
    try {
      const h = await api.hint(question.group_id);
      setHint(h);
      setHintUsed(true);
    } catch (e) {
      setError(String(e));
    }
  }

  function closeModal() {
    if (!result) return;
    if (result.valid) {
      if (level >= 10) {
        // Victory -> back to landing.
        onExit();
      } else {
        setLevel((l) => l + 1);
      }
    } else {
      // Lost -> reset to level 1 and clear score.
      setScore(0);
      setLevel(1);
    }
  }

  const isGameOver = result !== null && !result.valid;

  return (
    <div className="game">
      <div className="hud">
        <div className="hud__left">
          <span className="label">Pilot</span>
          <span className="hud__user">{username}</span>
          <span className="kbd">{mode === "hard" ? "HARD" : "NORMAL"}</span>
        </div>
        <div className="hud__right">
          <div className="hud__stat">
            <span className="label">Level</span>
            <span className="hud__stat-value">{level} / 10</span>
          </div>
          <div className="hud__stat">
            <span className="label">Score</span>
            <span className="hud__stat-value">{score}</span>
          </div>
          <button className="ghost" onClick={onExit} title="End session">
            Exit
          </button>
        </div>
      </div>

      <div className="game__body">
        {loadingQ && <div className="panel question">Generating routing brief…</div>}
        {error && !loadingQ && (
          <div className="panel question">
            <div className="error-text">Error: {error}</div>
            <button onClick={() => setLevel((l) => l)}>Retry</button>
          </div>
        )}
        {question && !loadingQ && (
          <>
            <div className="panel question">
              <div className="question__group">Level {question.level}</div>
              <div className="question__route">
                <Airport q={question} which="a" />
                <span className="question__arrow">→</span>
                <Airport q={question} which="b" />
              </div>
              <div className="question__on">
                on <strong>{question.group_name}</strong>
              </div>
              <div className="question__meta">
                <span>
                  Min stops: <strong>{question.min_stops}</strong>
                </span>
                <span>
                  Mode:{" "}
                  <strong>{mode === "hard" ? "Hard" : "Normal"}</strong>
                </span>
                {question.direct_available && (
                  <span style={{ color: "var(--color-warn)" }}>
                    Direct exists — <em>indirect routings only</em>
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={onHint}
                  disabled={hintUsed || !!result}
                  title="Reveal the airlines in this group (50% point penalty)"
                >
                  {hintUsed ? "Hint used ✓" : "Hint (–50% pts)"}
                </button>
              </div>
              {hint && (
                <div>
                  <div className="label" style={{ marginTop: 4 }}>
                    {hint.group_name}
                    {hint.anchor && ` — anchor ${hint.anchor}`}
                  </div>
                  <div className="hint-list">
                    {hint.airlines.map((a) => (
                      <span key={a.iata} className="hint-pill">
                        <strong>{a.iata}</strong>
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <LegsBuilder
              airports={airports}
              airlines={airlines}
              endpoints={{ a: question.a, b: question.b }}
              legs={legs}
              setLegs={setLegs}
              disabled={!!result}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                className="primary"
                onClick={onSubmit}
                disabled={!isComplete || submitting || !!result}
              >
                {submitting ? "Checking…" : "Submit answer"}
              </button>
            </div>
          </>
        )}
      </div>

      {result && question && (
        <ResultModal
          question={question}
          result={result}
          routes={routes?.routes}
          totalScore={score}
          isGameOver={isGameOver}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function Airport({ q, which }: { q: Question; which: "a" | "b" }) {
  const iata = which === "a" ? q.a : q.b;
  if (q.mode === "hard") {
    return <span className="question__airport">{iata}</span>;
  }
  const name = which === "a" ? q.a_name : q.b_name;
  const city = which === "a" ? q.a_city : q.b_city;
  const country = which === "a" ? q.a_country : q.b_country;
  return (
    <span className="question__airport">
      {iata}
      <span className="question__airport-meta">
        {[name, city, country].filter(Boolean).join(", ")}
      </span>
    </span>
  );
}
