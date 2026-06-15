// Fairness-balanced redraw (Option 2b):
//  - Every person gets exactly 2 teams.
//  - Each bundle pairs a stronger team with a weaker one so expected value is as
//    equal as possible across people (minimises the high/low spread).
//  - The 22 lowest-ranked teams are co-owned (2 owners); the 26 stronger teams are
//    sole-owned. Co-owners each score the team's full points (scoring unchanged).
import fs from "fs";

const FILE = new URL("../src/data/sweepstake.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(FILE));

const RANKED = [
  "Argentina","Spain","France","England","Brazil","Portugal","Netherlands","Belgium","Germany","Croatia",
  "Morocco","Colombia","Uruguay","Switzerland","Japan","USA","Senegal","Iran","Mexico","Austria",
  "Australia","Ecuador","South Korea","Canada","Sweden","Norway","Turkey","Egypt","Panama","Algeria",
  "Scotland","Cote d'Ivoire","Paraguay","Tunisia","Qatar","Saudi Arabia","Czechia","South Africa",
  "Iraq","Ghana","Uzbekistan","Cape Verde","Jordan","Bosnia","New Zealand","Congo DR","Curacao","Haiti"
];

const groupTeams = Object.values(data.groups).flat();
const miss = groupTeams.filter((t) => !RANKED.includes(t));
if (miss.length || RANKED.length !== 48) throw new Error("Ranking mismatch: " + miss);

// Expected season points by rank tier (steep, because knockout bonuses dominate).
function ev(r) {
  if (r <= 3) return 46; if (r <= 6) return 33; if (r <= 10) return 23;
  if (r <= 16) return 13; if (r <= 24) return 8; if (r <= 32) return 5;
  if (r <= 40) return 3; return 1.5;
}
const evOf = {};
RANKED.forEach((t, i) => (evOf[t] = ev(i + 1)));

// Seeded RNG so the "random" balanced draw is reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260616);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const N = data.participants.length; // 35
const doubles = N * 2 - 48;         // teams that need a 2nd owner = 22

// Token pool: every team once + the `doubles` lowest-EV teams a second time.
const lowest = [...RANKED].sort((a, b) => evOf[a] - evOf[b]).slice(0, doubles);
const tokens = [...RANKED, ...lowest];

// Sort by EV desc, breaking ties randomly for fairness.
const jitter = new Map(tokens.map((t, i) => [i, rand()]));
const idx = tokens.map((_, i) => i).sort((a, b) => evOf[tokens[b]] - evOf[tokens[a]] || jitter.get(a) - jitter.get(b));
const sorted = idx.map((i) => tokens[i]);

// Pair highest with lowest -> balanced bundles.
const bundles = [];
for (let i = 0; i < N; i++) bundles.push([sorted[i], sorted[sorted.length - 1 - i]]);

// Repair any bundle that accidentally holds the same team twice (a doubled team
// whose both tokens landed together) by swapping with a compatible bundle.
for (let i = 0; i < bundles.length; i++) {
  if (bundles[i][0] === bundles[i][1]) {
    for (let j = 0; j < bundles.length; j++) {
      if (j === i) continue;
      // swap bundles[i][1] with bundles[j][1] if it resolves both
      if (bundles[j][0] !== bundles[i][0] && bundles[j][1] !== bundles[i][0] &&
          bundles[i][1] !== bundles[j][0]) {
        [bundles[i][1], bundles[j][1]] = [bundles[j][1], bundles[i][1]];
        if (bundles[i][0] !== bundles[i][1] && bundles[j][0] !== bundles[j][1]) break;
      }
    }
  }
}

// Assign shuffled bundles to shuffled people.
const order = shuffle(data.participants.map((_, i) => i));
const shuffledBundles = shuffle(bundles);
const teamsByIndex = {};
order.forEach((personIdx, k) => (teamsByIndex[personIdx] = shuffledBundles[k]));

data.participants = data.participants.map((p, i) => ({
  name: p.name,
  initials: p.initials,
  teams: teamsByIndex[i]
}));

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");

const exps = data.participants.map((p) => p.teams.reduce((a, t) => a + evOf[t], 0)).sort((a, b) => b - a);
console.log("Balanced draw written.");
console.log("Everyone on 2 teams:", data.participants.every((p) => p.teams.length === 2));
console.log("Expected-points spread: hi", exps[0].toFixed(1), "lo", exps[exps.length - 1].toFixed(1),
  "ratio", (exps[0] / exps[exps.length - 1]).toFixed(1) + "x");
