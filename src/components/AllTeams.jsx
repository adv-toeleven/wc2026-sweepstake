import sweepstake from "../data/sweepstake.json";
import { flagFor } from "../utils/flags";

const { groups, scoring } = sweepstake;

// Map each team to its owner participant name(s).
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

// Group-stage points for one team from FINISHED group-stage matches.
function groupPointsFor(team, matches) {
  let pts = 0;
  matches.forEach((m) => {
    if (m.stage !== "GROUP_STAGE" || m.status !== "FINISHED") return;
    const home = m.homeTeam?.name;
    const away = m.awayTeam?.name;
    if (home !== team && away !== team) return;
    const ft = m.score?.fullTime || {};
    if (ft.home == null || ft.away == null) return;
    const isHome = home === team;
    const mine = isHome ? ft.home : ft.away;
    const theirs = isHome ? ft.away : ft.home;
    if (mine > theirs) pts += scoring.groupWin;
    else if (mine === theirs) pts += scoring.groupDraw;
    else pts += scoring.groupLoss;
  });
  return pts;
}

export default function AllTeams({ participants, matches }) {
  const owners = buildOwners(participants);
  const matchList = Array.isArray(matches) ? matches : [];

  return (
    <div className="allteams-grid">
      {Object.entries(groups).map(([letter, teams]) => (
        <div key={letter} className="group-card">
          <div className="group-header">Group {letter}</div>
          <div className="group-body">
            {teams.map((team) => (
              <div key={team} className="team-row">
                <span className="team-flag">{flagFor(team)}</span>
                <span className="team-info">
                  <span className="team-name">{team}</span>
                  <span className="team-owner">
                    {(owners[team] || ["Unassigned"]).join(", ")}
                  </span>
                </span>
                <span className="team-pts">{groupPointsFor(team, matchList)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
