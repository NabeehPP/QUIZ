import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const { data, error } = await supabaseAdmin
    .from("games")
    .update({ phase: "reveal" })
    .eq("code", code)
    .eq("phase", "question")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Game was not in question phase." },
      { status: 409 }
    );
  }
  return NextResponse.json({ game: data });
}
