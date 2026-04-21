import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const teamJson = body?.team ?? null;

    if (!name || !mode || !Number.isFinite(score)) {
      return NextResponse.json(
        { error: "Invalid submission." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from("ranked_scores").insert({
      name,
      mode,
      score,
      team_json: teamJson,
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
      .eq("mode", mode)
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