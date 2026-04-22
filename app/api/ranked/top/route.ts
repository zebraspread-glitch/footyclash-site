import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RankedRow = {
  id: string;
  name: string;
  mode: string;
  score: number;
  created_at: string;
  team_json: unknown;
};

function getStartOfWeekMonday() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "sc_points";
    const period = searchParams.get("period") ?? "all_time";

    let fromDate: Date | null = null;

    if (period === "daily") {
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      fromDate = getStartOfWeekMonday();
    } else if (period === "monthly") {
      fromDate = new Date();
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === "all_time") {
      fromDate = null;
    }

    let query = supabase
      .from("ranked_scores")
      .select("id, name, mode, score, created_at, team_json")
      .eq("mode", mode);

    if (fromDate) {
      query = query.gte("created_at", fromDate.toISOString());
    }

    const { data, error } = await query
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows: RankedRow[] = (data ?? []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      mode: String(row.mode ?? ""),
      score: Number(row.score) || 0,
      created_at: String(row.created_at ?? ""),
      team_json: row.team_json ?? null,
    }));

    const entries = rows.map((row, index) => ({
      id: row.id,
      name: row.name,
      score: row.score,
      rank: index + 1,
      team: row.team_json,
    }));

    const topScore = rows.length > 0 ? rows[0].score : 0;
    const topName = rows.length > 0 ? rows[0].name || "—" : "—";
    const totalEntries = rows.length;

    return NextResponse.json({
      topScore,
      topName,
      totalEntries,
      entries,
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