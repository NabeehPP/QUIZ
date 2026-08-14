import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const { data: game, error: gameErr } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  const nextIdx = game.current_question + 1;
  const isLastDone = nextIdx >= game.total_questions;

  const update = isLastDone
    ? { phase: "leaderboard", status: "finished" }
    : {
        phase: "question",
        current_question: nextIdx,
        question_started_at: new Date().toISOString(),
      };

  const { data, error } = await supabaseAdmin
    .from("games")
    .update(update)
    .eq("code", code)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ game: data });
}
