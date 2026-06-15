import { flagFor } from "../utils/flags";

const LIVE_STATUSES = ["IN_PLAY", "PAUSED"];

function sameLocalDay(date, ref) {
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDateHeading(d) {
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
}

// Build a map of team name -> list of owner participant names.
function buildOwners(participants) {
  const map = {};
  participants.forEach((p) => {
    p.teams.forEach((t) => {
      if (!map[t]) map[t] = [];
      map[t].push(p.name);
    });
  });
  return map;
}

function ownersLine(match, owners) {
  const names = new Set();
  [match.homeTeam?.name, match.awayTeam?.name].forEach((t) => {
    (owners[t] || []).forEach((n) => names.add(`${n} (${t})`));
  });
  if (names.size === 0) return null;
  return <div className="owners">{[...names].join(" · ")}</div>;
}

function ScoreBadge({ match }) {
  const ft = match.score?.fullTime || {};
  const hasScore = ft.home != null && ft.away != null;
  if (LIVE_STATUSES.includes(match.status)) {
    return (
      <span className="match-score">
        <span className="badge live">● LIVE</span>
        <span className="score">{ft.home ?? 0} – {ft.away ?? 0}</span>
      </span>
    );
  }
  if (match.status === "FINISHED") {
    return (
      <span className="match-score">
        <span className="badge ft">FT</span>
        <span className="score">{ft.home ?? 0} – {ft.away ?? 0}</span>
      </span>
    );
  }
  // Scheduled / timed
  return (
    <span className="match-score">
      <span className="kickoff">{hasScore ? `${ft.home} – ${ft.away}` : fmtTime(new Date(match.utcDate))}</span>
    </span>
  );
}

function MatchRow({ match, owners }) {
  return (
    <div className="match">
      <div className="match-teams">
        <span className="team">{flagFor(match.homeTeam?.name)} {match.homeTeam?.name}</span>
        <span className="vs">v</span>
        <span className="team away">{match.awayTeam?.name} {flagFor(match.awayTeam?.name)}</span>
      </div>
      <ScoreBadge match={match} />
      {ownersLine(match, owners)}
    </div>
  );
}

export default function LiveScores({
  matches,
  loading,
  error,
  lastUpdated,
  secondsUntilRefresh,
  participants,
  onRetry
}) {
  if (loading && (!matches || matches.length === 0)) {
    return (
      <div className="center-state">
        <div className="spinner" />
        <p>Loading matches…</p>
      </div>
    );
  }

  if (error && (!matches || matches.length === 0)) {
    return (
      <div className="center-state">
        <p className="error-text">{error}</p>
        {onRetry && <button className="retry-btn" onClick={onRetry}>Retry</button>}
      </div>
    );
  }

  const owners = buildOwners(participants);
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = startOfDay(new Date(now.getTime() - 86400000));
  const in3Days = startOfDay(new Date(now.getTime() + 4 * 86400000));

  const byDate = (a, b) => new Date(a.utcDate) - new Date(b.utcDate);

  const todayMatches = matches
    .filter((m) => sameLocalDay(new Date(m.utcDate), now))
    .sort(byDate);

  const yesterdayMatches = matches
    .filter(
      (m) =>
        sameLocalDay(new Date(m.utcDate), yesterday) && m.status === "FINISHED"
    )
    .sort(byDate);

  // Upcoming: next 3 days (excluding today), grouped by local date.
  const upcoming = matches
    .filter((m) => {
      const d = startOfDay(new Date(m.utcDate));
      return d > today && d < in3Days;
    })
    .sort(byDate);

  const upcomingGroups = {};
  upcoming.forEach((m) => {
    const key = fmtDateHeading(new Date(m.utcDate));
    if (!upcomingGroups[key]) upcomingGroups[key] = [];
    upcomingGroups[key].push(m);
  });

  return (
    <div className="livescores">
      {error && <div className="error-banner inline">{error} — showing last known data.</div>}

      <section className="ls-section">
        <h2>Today</h2>
        {todayMatches.length === 0 ? (
          <p className="muted">No matches scheduled today.</p>
        ) : (
          todayMatches.map((m) => <MatchRow key={m.id} match={m} owners={owners} />)
        )}
      </section>

      <section className="ls-section">
        <h2>Yesterday</h2>
        {yesterdayMatches.length === 0 ? (
          <p className="muted">No finished matches yesterday.</p>
        ) : (
          yesterdayMatches.map((m) => <MatchRow key={m.id} match={m} owners={owners} />)
        )}
      </section>

      <section className="ls-section">
        <h2>Upcoming</h2>
        {Object.keys(upcomingGroups).length === 0 ? (
          <p className="muted">No fixtures in the next 3 days.</p>
        ) : (
          Object.entries(upcomingGroups).map(([day, dayMatches]) => (
            <div key={day} className="day-group">
              <h3>{day}</h3>
              {dayMatches.map((m) => <MatchRow key={m.id} match={m} owners={owners} />)}
            </div>
          ))
        )}
      </section>

      <footer className="ls-footer">
        {lastUpdated
          ? `Last updated ${fmtTime(lastUpdated)} — Refreshing in ${secondsUntilRefresh}s`
          : "Waiting for data…"}
      </footer>
    </div>
  );
}
