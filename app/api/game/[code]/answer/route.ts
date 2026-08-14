import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { QUESTIONS, TIME_LIMIT_SECONDS } from "@/lib/questions";

const BASE_POINTS = 100;
const MAX_SPEED_BONUS = 50;
const GRACE_MS = 1500; // small network-latency grace period after the timer visually ends

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const body = await req.json().catch(() => ({}));
  const { teamId, questionIdx, selectedIndex } = body as {
    teamId?: string;
    questionIdx?: number;
    selectedIndex?: number;
  };

  if (
    !teamId ||
    typeof questionIdx !== "number" ||
    typeof selectedIndex !== "number" ||
    selectedIndex < 0 ||
    selectedIndex > 3
  ) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const { data: game, error: gameErr } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  if (game.phase !== "question" || game.current_question !== questionIdx) {
    return NextResponse.json(
      { error: "This question is no longer accepting answers." },
      { status: 409 }
    );
  }

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("game_code", code)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found in this game." }, { status: 404 });
  }

  // Prevent double answers
  const { data: existing } = await supabaseAdmin
    .from("answers")
    .select("id")
    .eq("game_code", code)
    .eq("team_id", teamId)
    .eq("question_idx", questionIdx)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ locked: true, alreadyAnswered: true });
  }

  const startedAt = game.question_started_at
    ? new Date(game.question_started_at).getTime()
    : Date.now();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - startedAt);
  const limitMs = TIME_LIMIT_SECONDS * 1000;

  if (elapsedMs > limitMs + GRACE_MS) {
    return NextResponse.json(
      { error: "Time's up — this answer arrived too late." },
      { status: 409 }
    );
  }

  const q = QUESTIONS[questionIdx];
  const isCorrect = selectedIndex === q.correctIndex;

  let points = 0;
  if (isCorrect) {
    const remainingFraction = Math.max(0, (limitMs - elapsedMs) / limitMs);
    const speedBonus = Math.round(MAX_SPEED_BONUS * remainingFraction);
    points = BASE_POINTS + speedBonus;
  }

  const { error: insertErr } = await supabaseAdmin.from("answers").insert({
    game_code: code,
    team_id: teamId,
    question_idx: questionIdx,
    selected_index: selectedIndex,
    is_correct: isCorrect,
    points,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Intentionally do NOT return correctness/points here — the team screen
  // only shows "Answer Locked!" until the host reveals the answer.
  return NextResponse.json({ locked: true });
}
