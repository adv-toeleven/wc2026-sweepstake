import { useState } from "react";
import { avatarColor, flagFor } from "../utils/flags";

const RANK_EMOJI = { 1: "🏆", 2: "🥈", 3: "🥉" };

// Assign ranks with ties sharing the same rank number (standard competition ranking).
function withRanks(participants) {
  let lastPoints = null;
  let lastRank = 0;
  return participants.map((p, i) => {
    let rank;
    if (lastPoints === p.totalPoints) {
      rank = lastRank;
    } else {
      rank = i + 1;
      lastRank = rank;
      lastPoints = p.totalPoints;
    }
    return { ...p, rank };
  });
}

function Breakdown({ rows }) {
  if (!rows.length) {
    return <div className="breakdown-empty">No points earned yet.</div>;
  }
  return (
    <table className="breakdown">
      <thead>
        <tr>
          <th>Team</th>
          <th>Stage</th>
          <th>Opponent</th>
          <th>Result</th>
          <th className="num">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{flagFor(r.team)} {r.team}</td>
            <td>{r.stage}</td>
            <td>vs {r.opponent}</td>
            <td>{r.result}</td>
            <td className="num">+{r.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Leaderboard({ participants }) {
  const [expanded, setExpanded] = useState(null);
  const ranked = withRanks(participants);

  return (
    <div className="leaderboard">
      {ranked.map((p) => {
        const isOpen = expanded === p.name;
        const isLeader = p.rank === 1;
        return (
          <div key={p.name} className={`lb-card ${isLeader ? "leader" : ""}`}>
            <button
              className="lb-row"
              onClick={() => setExpanded(isOpen ? null : p.name)}
              aria-expanded={isOpen}
            >
              <span className="lb-rank">
                {RANK_EMOJI[p.rank] || p.rank}
              </span>
              <span
                className="avatar"
                style={{ background: avatarColor(p.initials) }}
              >
                {p.initials}
              </span>
              <span className="lb-name">{p.name}</span>
              <span className="lb-teams">
                {p.teams.map((t) => (
                  <span key={t} className="pill">{flagFor(t)} {t}</span>
                ))}
              </span>
              <span className="lb-points">{p.totalPoints}</span>
              <span className={`chevron ${isOpen ? "open" : ""}`}>▾</span>
            </button>
            {isOpen && (
              <div className="lb-detail">
                <Breakdown rows={p.breakdown} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
