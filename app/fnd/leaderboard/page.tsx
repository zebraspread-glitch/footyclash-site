"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { matchInfo } from "@/app/data/fnd_markets";
import nilmaLogo from "@/app/fnd/nilma.png";
import bunyipLogo from "@/app/fnd/bunyip.png";

type BetLeg = {
  categoryKey: string;
  categoryLabel: string;
  selectionId: string;
  selectionLabel: string;
  odds: number;
};

type FndEntry = {
  id: string;
  match_id: string;
  user_name: string;
  total_odds: number;
  legs_json: BetLeg[];
  created_at: string;
};

// ✅ detect which team logo to use
function getLogo(label: string) {
  const lower = label.toLowerCase();

  if (lower.includes("bunyip")) return bunyipLogo;
  return nilmaLogo;
}

export default function FndLeaderboardPage() {
  const [entries, setEntries] = useState<FndEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  async function loadEntries() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("fnd-bets")
        .select("*")
        .eq("match_id", matchInfo.id)
        .order("total_odds", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(error.message || "Failed to load leaderboard.");
      }

      setEntries(Array.isArray(data) ? (data as FndEntry[]) : []);
    } catch (err) {
      setEntries([]);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  function toggleEntry(id: string) {
    setOpenEntryId((prev) => (prev === id ? null : id));
  }

  return (
    <main className="min-h-screen bg-[#eef3f7] text-[#0a2d4f]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-[24px] border border-[#c9d7e4] bg-white shadow-[0_10px_30px_rgba(13,43,73,0.08)]">
          <div className="border-b border-[#dbe5ee] px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6e88a3]">
                  FND
                </div>
                <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                  Leaderboard
                </h1>
                <div className="mt-2 text-sm font-semibold text-[#5f7b95]">
                  {matchInfo.round} • {matchInfo.venue}
                </div>
              </div>

              <Link
                href="/fnd"
                className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#d6e2ec] bg-white px-4 text-sm font-extrabold text-[#0a2d4f] transition hover:bg-[#f7fafc]"
              >
                Back
              </Link>
            </div>
          </div>

          {/* ✅ ONLY TOTAL ENTRIES NOW */}
          <div className="border-b border-[#dbe5ee] p-4 sm:p-6">
            <div className="rounded-[18px] border border-[#d6e2ec] bg-[#f7fafc] p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6c88a2]">
                TOTAL ENTRIES
              </div>
              <div className="mt-2 text-3xl font-black">
                {loading ? "..." : entries.length}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-6">
            {error ? (
              <div className="rounded-[16px] border border-red-200 bg-red-50 p-4">
                <div className="text-lg font-extrabold text-red-700">
                  Could not load leaderboard
                </div>
                <div className="mt-1 text-sm font-semibold text-red-600">
                  {error}
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[72px] animate-pulse rounded-[16px] border border-[#dce7f0] bg-[#f7fafc]"
                  />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-[16px] border border-[#dce7f0] bg-[#f7fafc] p-6 text-center">
                <div className="text-xl font-extrabold text-[#0a2d4f]">
                  No entries yet
                </div>
                <div className="mt-2 text-sm font-semibold text-[#6d869d]">
                  Be the first to submit a multi.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => {
                  const isOpen = openEntryId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="overflow-hidden rounded-[18px] border border-[#dce7f0] bg-[#f7fafc]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleEntry(entry.id)}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-[#edf4f9]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xl font-black text-[#0a2d4f]">
                            {entry.user_name}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="rounded-[12px] border border-[#b5cadc] bg-[#edf3f8] px-4 py-3 text-xl font-black text-[#0a2d4f]">
                            {Number(entry.total_odds).toFixed(2)}
                          </div>
                          <div className="text-sm font-extrabold text-[#5f7b95]">
                            {isOpen ? "Hide" : "View"}
                          </div>
                        </div>
                      </button>

                      {isOpen &&
                      Array.isArray(entry.legs_json) &&
                      entry.legs_json.length > 0 ? (
                        <div className="border-t border-[#dce7f0] px-4 pb-4 pt-4">
                          <div className="space-y-2">
                            {entry.legs_json.map((leg, legIndex) => {
                              const logo = getLogo(leg.selectionLabel);

                              return (
                                <div
                                  key={`${entry.id}-${legIndex}`}
                                  className="flex items-center gap-3 rounded-[12px] border border-[#dce7f0] bg-white px-3 py-3"
                                >
                                  <Image
                                    src={logo}
                                    alt="team logo"
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 object-contain"
                                  />

                                  <div className="min-w-0">
                                    <div className="text-sm font-extrabold text-[#0a2d4f]">
                                      {leg.selectionLabel}
                                    </div>
                                    <div className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#7890a7]">
                                      {leg.categoryLabel} •{" "}
                                      {Number(leg.odds).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}