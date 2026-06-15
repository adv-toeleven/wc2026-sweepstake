// Flag emoji for each canonical sweepstake team name.
export const FLAGS = {
  "Mexico": "🇲🇽",
  "South Korea": "🇰🇷",
  "Czechia": "🇨🇿",
  "South Africa": "🇿🇦",
  "Canada": "🇨🇦",
  "Switzerland": "🇨🇭",
  "Qatar": "🇶🇦",
  "Bosnia": "🇧🇦",
  "Brazil": "🇧🇷",
  "Morocco": "🇲🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Haiti": "🇭🇹",
  "USA": "🇺🇸",
  "Paraguay": "🇵🇾",
  "Colombia": "🇨🇴",
  "Panama": "🇵🇦",
  "Germany": "🇩🇪",
  "Cote d'Ivoire": "🇨🇮",
  "Ecuador": "🇪🇨",
  "Curacao": "🇨🇼",
  "Netherlands": "🇳🇱",
  "Japan": "🇯🇵",
  "Sweden": "🇸🇪",
  "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪",
  "Iran": "🇮🇷",
  "New Zealand": "🇳🇿",
  "Egypt": "🇪🇬",
  "Spain": "🇪🇸",
  "Saudi Arabia": "🇸🇦",
  "Uruguay": "🇺🇾",
  "Cape Verde": "🇨🇻",
  "France": "🇫🇷",
  "Iraq": "🇮🇶",
  "Norway": "🇳🇴",
  "Senegal": "🇸🇳",
  "Argentina": "🇦🇷",
  "Algeria": "🇩🇿",
  "Austria": "🇦🇹",
  "Jordan": "🇯🇴",
  "Portugal": "🇵🇹",
  "Turkey": "🇹🇷",
  "Ghana": "🇬🇭",
  "Uzbekistan": "🇺🇿",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croatia": "🇭🇷",
  "Australia": "🇦🇺",
  "Congo DR": "🇨🇩"
};

export function flagFor(team) {
  return FLAGS[team] || "🏳️";
}

// 8 rotating avatar background colours, picked deterministically from initials.
const AVATAR_COLORS = [
  "#00993A",
  "#00561E",
  "#F89372",
  "#2E86C1",
  "#8E44AD",
  "#E67E22",
  "#16A085",
  "#C0392B"
];

export function avatarColor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
