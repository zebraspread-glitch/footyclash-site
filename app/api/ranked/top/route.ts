import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RankedRow = {
  id: string;
  name: string;
  mode: string;
  score: number;
  created_at: string;
  team_json: Record<string, string | null> | null;
};

const VALID_PERIODS = ["daily", "weekly", "monthly", "all_time"] as const;

function getStartOfWeekMonday() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;

  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function getFromDate(period: string): Date | null {
  if (period === "daily") {
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    return fromDate;
  }

  if (period === "weekly") {
    return getStartOfWeekMonday();
  }

  if (period === "monthly") {
    const fromDate = new Date();
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);
    return fromDate;
  }

  return null;
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
    const rawPeriod = searchParams.get("period") ?? "all_time";
    const period = VALID_PERIODS.includes(rawPeriod as any)
      ? rawPeriod
      : "all_time";

    const previewScoreParam = searchParams.get("score");
    const previewScore =
      previewScoreParam !== null ? Number(previewScoreParam) : null;

    const fromDate = getFromDate(period);

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows: RankedRow[] = (data ?? []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      mode: String(row.mode ?? ""),
      score: Number(row.score ?? 0) || 0,
      created_at: String(row.created_at ?? ""),
      team_json:
        row.team_json && typeof row.team_json === "object"
          ? row.team_json
          : null,
    }));

    const entries = rows.map((row, index) => ({
      id: row.id,
      name: row.name || "Unknown",
      score: row.score, // IMPORTANT: this is the frozen Supabase score
      rank: index + 1,
      team: row.team_json,
    }));

    const topScore = rows.length > 0 ? rows[0].score : 0;
    const topName = rows.length > 0 ? rows[0].name || "—" : "—";
    const totalEntries = rows.length;

    let estimatedRank: number | null = null;

    if (typeof previewScore === "number" && Number.isFinite(previewScore)) {
      estimatedRank = rows.filter((row) => row.score > previewScore).length + 1;
    }

    return NextResponse.json({
      topScore,
      topName,
      totalEntries,
      estimatedRank,
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