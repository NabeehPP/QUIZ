import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const { data: game } = await supabaseAdmin
    .from("games")
    .select("current_question, phase")
    .eq("code", code)
    .single();

  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });

  const { count } = await supabaseAdmin
    .from("answers")
    .select("id", { count: "exact", head: true })
    .eq("game_code", code)
    .eq("question_idx", game.current_question);

  const { count: teamCount } = await supabaseAdmin
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("game_code", code);

  return NextResponse.json({ answered: count ?? 0, totalTeams: teamCount ?? 0 });
}
