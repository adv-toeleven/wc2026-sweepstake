import { useMemo, useState } from "react";
import sweepstake from "./data/sweepstake.json";
import { useMatches } from "./hooks/useMatches";
import { calculateScores } from "./utils/scoring";
import Leaderboard from "./components/Leaderboard";
import LiveScores from "./components/LiveScores";
import AllTeams from "./components/AllTeams";
import "./App.css";

const TABS = [
  { id: "leaderboard", label: "Leaderboard" },
  { id: "live", label: "Live Scores" },
  { id: "teams", label: "All Teams" }
];

export default function App() {
  const [tab, setTab] = useState("leaderboard");
  const { matches, loading, error, lastUpdated, secondsUntilRefresh, refetch } =
    useMatches();

  const scored = useMemo(
    () => calculateScores(sweepstake.participants, matches),
    [matches]
  );

  const firstLoad = loading && matches.length === 0;

  return (
    <div className="app">
      <header className="app-header">
        <span className="wordmark">interu</span>
        <span className="app-title">WC 2026 Sweepstake</span>
      </header>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && !firstLoad && (
        <div className="error-banner">{error} — showing last known data.</div>
      )}

      <main className="app-main">
        {firstLoad ? (
          <div className="center-state full">
            <div className="spinner" />
            <p>Loading sweepstake…</p>
          </div>
        ) : (
          <>
            {tab === "leaderboard" && <Leaderboard participants={scored} />}
            {tab === "live" && (
              <LiveScores
                matches={matches}
                loading={loading}
                error={error}
                lastUpdated={lastUpdated}
                secondsUntilRefresh={secondsUntilRefresh}
                participants={scored}
                onRetry={refetch}
              />
            )}
            {tab === "teams" && (
              <AllTeams participants={scored} matches={matches} />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        iov42 / interu · FIFA World Cup 2026 · 11 Jun – 19 Jul 2026
      </footer>
    </div>
  );
}
