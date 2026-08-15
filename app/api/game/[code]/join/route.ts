import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TEAM_COLORS } from "@/lib/colors";

const MAX_TEAMS = 8;

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const body = await req.json().catch(() => ({}));
  const rawName = typeof body.name === "string" ? body.name.trim() : "";

  if (!rawName) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }
  if (rawName.length > 24) {
    return NextResponse.json(
      { error: "Team name must be 24 characters or fewer." },
      { status: 400 }
    );
  }

  const { data: game, error: gameErr } = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  if (game.phase !== "lobby") {
    return NextResponse.json(
      { error: "This game has already started." },
      { status: 409 }
    );
  }

  const { data: existingTeams, error: teamsErr } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("game_code", code)
    .order("joined_at", { ascending: true });

  if (teamsErr) {
    return NextResponse.json({ error: teamsErr.message }, { status: 500 });
  }

  const already = existingTeams?.find(
    (t) => t.name.toLowerCase() === rawName.toLowerCase()
  );
  if (already) {
    // Allow reconnect with the same team name (e.g. page refresh).
    return NextResponse.json({ team: already, game });
  }

  if ((existingTeams?.length ?? 0) >= MAX_TEAMS) {
    return NextResponse.json(
      { error: "This game already has the maximum of 8 teams." },
      { status: 409 }
    );
  }

  const usedColors = new Set(existingTeams?.map((t) => t.color));
  const color =
    TEAM_COLORS.find((c) => !usedColors.has(c.hex))?.hex ??
    TEAM_COLORS[existingTeams!.length % TEAM_COLORS.length].hex;

  const { data: team, error: insertErr } = await supabaseAdmin
    .from("teams")
    .insert({ game_code: code, name: rawName, color })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ team, game });
}
