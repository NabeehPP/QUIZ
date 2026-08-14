"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { GameRow, TeamRow } from "@/lib/types";

export function useGameRealtime(code: string | null) {
  const [game, setGame] = useState<GameRow | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    let active = true;

    async function loadInitial(showLoading = true) {
    if (showLoading) setLoading(true);
      const [{ data: g }, { data: t }] = await Promise.all([
        supabase.from("games").select("*").eq("code", code as string).single(),
        supabase
          .from("teams")
          .select("*")
          .eq("game_code", code as string)
          .order("joined_at", { ascending: true }),
      ]);
      if (!active) return;
      setGame(g ?? null);
      setTeams(t ?? []);
      if (showLoading) setLoading(false);
    }
    loadInitial();

    const channel = supabase
      .channel(`game-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `code=eq.${code}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          setGame(payload.new as GameRow);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `game_code=eq.${code}` },
        () => {
          // Re-fetch full team list on any change to keep ordering consistent.
          supabase
            .from("teams")
            .select("*")
            .eq("game_code", code as string)
            .order("joined_at", { ascending: true })
            .then(({ data }) => {
              if (active) setTeams(data ?? []);
            });
        }
      )
      .subscribe();

    // Fallback poll in case realtime hiccups on venue wifi — cheap and reliable.
    const pollId = setInterval(() => loadInitial(false), 4000);

    return () => {
      active = false;
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [code]);

  return { game, teams, loading };
}
