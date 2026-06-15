import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { getCanonicalName } from "../utils/teamNameMap";

const REFRESH_SECONDS = 60;

// The data is fetched server-side by a scheduled GitHub Action (which holds the
// API key as a secret) and written to a same-origin static file. The browser
// reads that file — football-data.org does not send CORS headers, so the API
// cannot be called directly from the browser.
const DATA_URL = `${import.meta.env.BASE_URL}matches.json`;

// Applies canonical sweepstake names to both teams of every match.
function normalizeMatches(rawMatches) {
  return rawMatches.map((m) => ({
    ...m,
    homeTeam: { ...m.homeTeam, name: getCanonicalName(m.homeTeam?.name) },
    awayTeam: { ...m.awayTeam, name: getCanonicalName(m.awayTeam?.name) }
  }));
}

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_SECONDS);

  const haveData = useRef(false);

  const fetchMatches = useCallback(async () => {
    try {
      // Cache-bust so we always get the freshest file the Action published.
      const res = await axios.get(DATA_URL, { params: { t: Date.now() } });
      const raw = res.data?.matches || [];
      setMatches(normalizeMatches(raw));
      setLastUpdated(new Date());
      setError(null);
      haveData.current = true;
    } catch (err) {
      // Keep showing stale data if we already have some.
      const status = err.response?.status;
      const msg = status
        ? `Data error ${status} — match data file unavailable`
        : err.message || "Failed to load match data";
      setError(msg);
    } finally {
      setLoading(false);
      setSecondsUntilRefresh(REFRESH_SECONDS);
    }
  }, []);

  // Initial fetch + 60s refresh interval.
  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Countdown tick.
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsUntilRefresh((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return { matches, loading, error, lastUpdated, secondsUntilRefresh, refetch: fetchMatches };
}
