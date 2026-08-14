import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  await supabaseAdmin.from("answers").delete().eq("game_code", code);
  await supabaseAdmin.from("teams").delete().eq("game_code", code);

  const { data, error } = await supabaseAdmin
    .from("games")
    .update({
      status: "lobby",
      phase: "lobby",
      current_question: -1,
      question_started_at: null,
    })
    .eq("code", code)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ game: data });
}
