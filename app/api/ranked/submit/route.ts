import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import players2026 from "@/app/data/afl_players26.json";

type StatMode =
  | "age"
  | "number"
  | "disposals"
  | "goals"
  | "kicks"
  | "handballs"
  | "marks"
  | "tackles"
  | "hitouts"
  | "sc_points"
  | "bounces"
  | "metres_gained";

type RawPlayer = {
  id?: string | number;
  name?: string;
  club?: string;
  team?: string;
  age?: number | string;
  number?: number | string;
  disposals?: number | string;
  goals?: number | string;
  kicks?: number | string;
  handballs?: number | string;
  marks?: number | string;
  tackles?: number | string;
  hitouts?: number | string;
  sc_points?: number | string;
  bounces?: number | string;
  metres_gained?: number | string;
};

const VALID_MODES: StatMode[] = [
  "age",
  "number",
  "disposals",
  "goals",
  "kicks",
  "handballs",
  "marks",
  "tackles",
  "hitouts",
  "sc_points",
  "bounces",
  "metres_gained",
];

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function getPlayerMap() {
  const list = Array.isArray(players2026) ? (players2026 as RawPlayer[]) : [];

  return new Map(
    list.map((player, index) => {
      const id =
        player.id != null && String(player.id).trim()
          ? String(player.id)
          : `${player.name ?? "Player"}-${player.club ?? player.team ?? ""}-${index}`;

      return [
        id,
        {
          id,
          name: String(player.name ?? "Unknown Player"),
          club: String(player.club ?? player.team ?? ""),
          stats: {
            age: parseNumber(player.age),
            number: parseNumber(player.number),
            disposals: parseNumber(player.disposals),
            goals: parseNumber(player.goals),
            kicks: parseNumber(player.kicks),
            handballs: parseNumber(player.handballs),
            marks: parseNumber(player.marks),
            tackles: parseNumber(player.tackles),
            hitouts: parseNumber(player.hitouts),
            sc_points: parseNumber(player.sc_points),
            bounces: parseNumber(player.bounces),
            metres_gained: parseNumber(player.metres_gained),
          } satisfies Record<StatMode, number>,
        },
      ];
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();

    const name =
      typeof body?.name === "string" ? body.name.trim().slice(0, 20) : "";

    const mode = typeof body?.mode === "string" ? body.mode.trim() : "";

    const score = Number(body?.score);
    const team = body?.team && typeof body.team === "object" ? body.team : null;

    if (
      !name ||
      !VALID_MODES.includes(mode as StatMode) ||
      !Number.isFinite(score) ||
      !team
    ) {
      return NextResponse.json(
        { error: "Invalid submission." },
        { status: 400 }
      );
    }

    const statMode = mode as StatMode;
    const playerMap = getPlayerMap();

    const teamSnapshot: Record<
      string,
      | {
          id: string;
          name: string;
          club: string;
          value: number;
        }
      | null
    > = {};

    for (const [slot, playerId] of Object.entries(team)) {
      if (!playerId || typeof playerId !== "string") {
        teamSnapshot[slot] = null;
        continue;
      }

      const player = playerMap.get(playerId);

      if (!player) {
        teamSnapshot[slot] = {
          id: playerId,
          name: playerId,
          club: "",
          value: 0,
        };
        continue;
      }

      teamSnapshot[slot] = {
        id: player.id,
        name: player.name,
        club: player.club,
        value: player.stats[statMode] ?? 0,
      };
    }

    const { error: insertError } = await supabase.from("ranked_scores").insert({
      name,
      mode: statMode,
      score, // frozen total score
      team_json: teamSnapshot, // frozen team/player stat snapshot
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { data, error: rankError } = await supabase
      .from("ranked_scores")
      .select("score")
      .eq("mode", statMode)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true });

    if (rankError) {
      return NextResponse.json({ ok: true });
    }

    let rank = 1;

    for (const row of data ?? []) {
      if (Number(row.score) > score) rank += 1;
      else break;
    }

    return NextResponse.json({
      ok: true,
      rank,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected server error.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}