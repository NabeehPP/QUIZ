import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const REQUIRED_TEAMS = 7;

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const body = await req.json().catch(() => ({}));
  const testMode = body?.testMode === true;

  const { data: teams } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("game_code", code);

  const teamCount = teams?.length ?? 0;

  if (testMode) {
    if (teamCount < 1) {
      return NextResponse.json(
        { error: "At least one team must join before starting." },
        { status: 400 }
      );
    }
  } else if (teamCount !== REQUIRED_TEAMS) {
    return NextResponse.json(
      {
        error: `Exactly ${REQUIRED_TEAMS} teams must join before starting (currently ${teamCount}). Enable Test Mode to start with fewer teams.`,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("games")
    .update({
      status: "active",
      phase: "question",
      current_question: 0,
      question_started_at: new Date().toISOString(),
    })
    .eq("code", code)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ game: data });
}
