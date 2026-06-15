// NOTE: The football-data.org API does not send CORS headers, so it cannot be
// called from the browser. Match data is fetched server-side by the scheduled
// GitHub Action (.github/workflows/deploy.yml), which holds the key as the
// FOOTBALL_API_KEY repo secret, and is written to /matches.json which the app
// reads. The key is intentionally NOT shipped in the client bundle.
export const API_BASE = "https://api.football-data.org/v4";
