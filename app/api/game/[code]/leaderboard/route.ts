import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { LeaderboardEntry } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("phase")
    .eq("code", code)
    .single();

  if (!game || game.phase !== "leaderboard") {
    return NextResponse.json(
      { error: "Scores are hidden until the quiz is finished." },
      { status: 403 }
    );
  }

  const { data: teams, error: teamsErr } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("game_code", code);

  if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });

  const { data: answers, error: answersErr } = await supabaseAdmin
    .from("answers")
    .select("*")
    .eq("game_code", code);

  if (answersErr) return NextResponse.json({ error: answersErr.message }, { status: 500 });

  const entries: LeaderboardEntry[] = (teams ?? []).map((t) => {
    const teamAnswers = (answers ?? []).filter((a) => a.team_id === t.id);
    const score = teamAnswers.reduce((sum, a) => sum + a.points, 0);
    const correct = teamAnswers.filter((a) => a.is_correct).length;
    return { teamId: t.id, name: t.name, color: t.color, score, correct };
  });

  entries.sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard: entries });
}
