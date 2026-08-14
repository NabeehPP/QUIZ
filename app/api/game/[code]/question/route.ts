import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { QUESTIONS, TIME_LIMIT_SECONDS } from "@/lib/questions";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const { searchParams } = new URL(req.url);
  const idxParam = searchParams.get("idx");

  const { data: game, error } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  const idx = idxParam !== null ? parseInt(idxParam, 10) : game.current_question;

  if (idx < 0 || idx >= QUESTIONS.length) {
    return NextResponse.json({ error: "Invalid question index." }, { status: 400 });
  }

  const q = QUESTIONS[idx];
  const base = {
    idx,
    total: QUESTIONS.length,
    question: q.question,
    options: q.options,
    timeLimit: TIME_LIMIT_SECONDS,
    questionStartedAt: game.question_started_at,
    phase: game.phase,
  };

  const isRevealForThisQuestion = game.phase === "reveal" && idx === game.current_question;
  const isLeaderboardOrLater =
    game.phase === "leaderboard" && idx <= game.current_question;

  if (isRevealForThisQuestion || isLeaderboardOrLater) {
    return NextResponse.json({
      ...base,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    });
  }

  return NextResponse.json(base);
}
