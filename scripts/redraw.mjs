// Rank-based redraw:
//  - Top 10 teams (FIFA world ranking, approx) → sole owner who holds ONLY that team.
//  - Bottom 10 teams → co-owned by exactly 2 people (absorbs the surplus participants).
//  - Middle 28 teams → sole-owned by people who also hold one other team.
// Result for 34 people / 48 teams: 10 people on 1 team, 24 on 2 teams, 10 teams shared.
import fs from "fs";

const FILE = new URL("../src/data/sweepstake.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(FILE));

// Approximate FIFA world ranking order (1 = strongest) across the 48 qualified teams.
const RANKED = [
  "Argentina","Spain","France","England","Brazil","Portugal","Netherlands","Belgium","Germany","Croatia", // top 10
  "Morocco","Colombia","Uruguay","Switzerland","Japan","USA","Senegal","Iran","Mexico","Austria",
  "Australia","Ecuador","South Korea","Canada","Sweden","Norway","Turkey","Egypt","Panama","Algeria",
  "Scotland","Cote d'Ivoire","Paraguay","Tunisia","Qatar","Saudi Arabia","Czechia","South Africa",       // mid ends (38)
  "Iraq","Ghana","Uzbekistan","Cape Verde","Jordan","Bosnia","New Zealand","Congo DR","Curacao","Haiti"  // bottom 10
];

// sanity: ranking must exactly match the tournament's 48 teams
const groupTeams = Object.values(data.groups).flat();
const missing = groupTeams.filter((t) => !RANKED.includes(t));
const extra = RANKED.filter((t) => !groupTeams.includes(t));
if (missing.length || extra.length || RANKED.length !== 48) {
  throw new Error(`Ranking mismatch. missing=${missing} extra=${extra} len=${RANKED.length}`);
}

const top10 = RANKED.slice(0, 10);
const mid = RANKED.slice(10, 38);   // 28 teams
const bottom10 = RANKED.slice(38);  // 10 teams

// Deterministic seeded RNG (mulberry32) so the draw is reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260615);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Keep names + initials; wipe teams and reassign.
const people = data.participants.map((p) => ({ name: p.name, initials: p.initials, teams: [] }));

const shuffledPeople = shuffle(people);
const sTop = shuffle(top10);
const sMid = shuffle(mid);
const sBottom = shuffle(bottom10);

// 10 marquee owners — one top-10 team each, nothing else.
for (let i = 0; i < 10; i++) shuffledPeople[i].teams.push(sTop[i]);

// 24 two-team owners.
const two = shuffledPeople.slice(10); // 24 people
// People 0..19 of the 24: each gets one bottom team (each bottom team -> 2 owners) + one mid team.
for (let k = 0; k < 10; k++) {
  two[k].teams.push(sBottom[k]);       // first owner of bottom team k
  two[k + 10].teams.push(sBottom[k]);  // second owner of bottom team k
}
for (let k = 0; k < 20; k++) two[k].teams.push(sMid[k]); // one mid each
// People 20..23 of the 24: two mid teams each (remaining 8 mids).
let mi = 20;
for (let k = 20; k < 24; k++) {
  two[k].teams.push(sMid[mi++]);
  two[k].teams.push(sMid[mi++]);
}

// Write back in the ORIGINAL participant order (so the file stays stable/readable).
const byName = Object.fromEntries(shuffledPeople.map((p) => [p.name, p.teams]));
data.participants = data.participants.map((p) => ({
  name: p.name,
  initials: p.initials,
  teams: byName[p.name]
}));

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
console.log("Redraw written. Marquee (1-team) owners:");
data.participants.filter((p) => p.teams.length === 1).forEach((p) => console.log("  " + p.name + " → " + p.teams[0]));
