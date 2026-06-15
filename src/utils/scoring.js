// Scoring logic for the WC 2026 sweepstake.
// Matches arriving here are expected to already have canonical team names applied.

import sweepstake from "../data/sweepstake.json";

const S = sweepstake.scoring;

// Knockout stages: points awarded only when the team WINS that match
// (i.e. advances to the next round). The FINAL is special-cased below.
const KNOCKOUT_WIN_POINTS = {
  ROUND_OF_32: S.roundOf32,
  LAST_16: S.roundOf16,
  QUARTER_FINALS: S.quarterFinal,
  SEMI_FINALS: S.semiFinal
};

const STAGE_LABELS = {
  GROUP_STAGE: "Group Stage",
  ROUND_OF_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  FINAL: "Final"
};

// Returns { points, result, opponent } for one team in one FINISHED match,
// or null if this match does not involve the team or isn't scorable.
function scoreMatchForTeam(team, match) {
  const home = match.homeTeam?.name;
  const away = match.awayTeam?.name;
  if (home !== team && away !== team) return null;
  if (match.status !== "FINISHED") return null;

  const ft = match.score?.fullTime || {};
  const homeGoals = ft.home;
  const awayGoals = ft.away;
  if (homeGoals == null || awayGoals == null) return null;

  const isHome = home === team;
  const myGoals = isHome ? homeGoals : awayGoals;
  const theirGoals = isHome ? awayGoals : homeGoals;
  const opponent = isHome ? away : home;

  const stage = match.stage;
  let won = myGoals > theirGoals;
  let lost = myGoals < theirGoals;
  let drew = myGoals === theirGoals;

  // Knockout ties can be decided by penalties — use penalties when level on full time.
  if (stage !== "GROUP_STAGE" && drew) {
    const pens = match.score?.penalties || {};
    if (pens.home != null && pens.away != null) {
      const myPens = isHome ? pens.home : pens.away;
      const theirPens = isHome ? pens.away : pens.home;
      won = myPens > theirPens;
      lost = myPens < theirPens;
      drew = false;
    }
  }

  let points = 0;
  let result = "Loss";

  if (stage === "GROUP_STAGE") {
    if (won) { points = S.groupWin; result = "Win"; }
    else if (drew) { points = S.groupDraw; result = "Draw"; }
    else { points = S.groupLoss; result = "Loss"; }
  } else if (stage === "FINAL") {
    if (won) { points = S.winner; result = "Winner"; }
    else { points = S.runnerUp; result = "Runner-up"; }
  } else if (KNOCKOUT_WIN_POINTS[stage] != null) {
    if (won) { points = KNOCKOUT_WIN_POINTS[stage]; result = "Win"; }
    else { points = 0; result = "Loss"; }
  } else {
    return null;
  }

  return { points, result, opponent };
}

export function calculateScores(participants, matches) {
  const matchList = Array.isArray(matches) ? matches : [];

  const scored = participants.map((p) => {
    const breakdown = [];
    let totalPoints = 0;

    p.teams.forEach((team) => {
      matchList.forEach((match) => {
        const res = scoreMatchForTeam(team, match);
        if (!res) return;
        totalPoints += res.points;
        breakdown.push({
          team,
          opponent: res.opponent,
          stage: STAGE_LABELS[match.stage] || match.stage,
          result: res.result,
          points: res.points,
          date: match.utcDate
        });
      });
    });

    breakdown.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      name: p.name,
      initials: p.initials,
      teams: p.teams,
      totalPoints,
      breakdown
    };
  });

  scored.sort((a, b) => b.totalPoints - a.totalPoints);
  return scored;
}
