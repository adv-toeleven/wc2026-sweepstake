import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE, FOOTBALL_API_KEY } from "../config";
import { getCanonicalName } from "../utils/teamNameMap";

const REFRESH_SECONDS = 60;

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
      const res = await axios.get(`${API_BASE}/competitions/WC/matches`, {
        headers: { "X-Auth-Token": FOOTBALL_API_KEY }
      });
      const raw = res.data?.matches || [];
      setMatches(normalizeMatches(raw));
      setLastUpdated(new Date());
      setError(null);
      haveData.current = true;
    } catch (err) {
      // Keep showing stale data if we already have some.
      const status = err.response?.status;
      const msg = status
        ? `API error ${status}${status === 403 ? " — check your API key in src/config.js" : ""}`
        : err.message || "Failed to fetch matches";
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
