import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateGameCode } from "@/lib/gameCode";
import { QUESTIONS } from "@/lib/questions";

export async function POST() {
  // Try a few times in the (very unlikely) case of a code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGameCode();
    const { data, error } = await supabaseAdmin
      .from("games")
      .insert({
        code,
        status: "lobby",
        phase: "lobby",
        current_question: -1,
        total_questions: QUESTIONS.length,
      })
      .select()
      .single();

    if (!error && data) {
      return NextResponse.json({ game: data });
    }
    // 23505 = unique_violation, try again with a new code
    if (error && (error as any).code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json(
    { error: "Could not generate a unique game code, please try again." },
    { status: 500 }
  );
}
