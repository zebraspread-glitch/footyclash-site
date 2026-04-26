"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { matchInfo } from "@/app/data/fnd_markets";
import nilmaLogo from "@/app/fnd/nilma.png";
import bunyipLogo from "@/app/fnd/bunyip.png";

const ADMIN_PASSWORD = "tom123";

type LegStatus = "pending" | "hit" | "miss" | "void";

type BetLeg = {
  categoryKey: string;
  categoryLabel: string;
  selectionId: string;
  selectionLabel: string;
  odds: number;
  status?: LegStatus;
};

type FndEntry = {
  id: string;
  match_id: string;
  user_name: string;
  total_odds: number;
  legs_json: BetLeg[];
  created_at: string;
};

function getLogo(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("bunyip")) return bunyipLogo;
  return nilmaLogo;
}

function getActiveLegs(legs: BetLeg[]) {
  if (!Array.isArray(legs)) return [];
  return legs.filter((leg) => leg.status !== "void");
}

function getLegHitCount(legs: BetLeg[]) {
  const activeLegs = getActiveLegs(legs);
  const hitLegs = activeLegs.filter((leg) => leg.status === "hit");
  return `${hitLegs.length}/${activeLegs.length}`;
}

function getParlayStatus(legs: BetLeg[]): LegStatus {
  if (!Array.isArray(legs) || legs.length === 0) return "pending";

  const hasVoid = legs.some((leg) => leg.status === "void");
  if (hasVoid) return "void";

  const hasMiss = legs.some((leg) => leg.status === "miss");
  if (hasMiss) return "miss";

  const allHit = legs.every((leg) => leg.status === "hit");
  if (allHit) return "hit";

  return "pending";
}

function statusStyles(status?: LegStatus) {
  if (status === "hit") return "border-green-300 bg-green-100 text-green-700";
  if (status === "miss") return "border-red-300 bg-red-100 text-red-700";
  if (status === "void") return "border-slate-300 bg-slate-100 text-slate-700";
  return "border-yellow-300 bg-yellow-100 text-yellow-700";
}

function statusText(status?: LegStatus) {
  if (status === "hit") return "HIT";
  if (status === "miss") return "MISS";
  if (status === "void") return "VOID";
  return "PENDING";
}

function parlayText(status: LegStatus, hitCount: string) {
  if (status === "hit") return `PARLAY HIT • ${hitCount}`;
  if (status === "miss") return `PARLAY LOST • ${hitCount}`;
  if (status === "void") return `VOID • ${hitCount}`;
  return `PENDING • ${hitCount}`;
}

export default function FndLeaderboardPage() {
  const [entries, setEntries] = useState<FndEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLeg, setSavingLeg] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedAdmin = localStorage.getItem("fnd-admin-unlocked");
    if (savedAdmin === "true") setIsAdmin(true);

    loadEntries();
  }, []);

  function unlockAdmin() {
    const password = window.prompt("Enter admin password");

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("fnd-admin-unlocked", "true");
      setIsAdmin(true);
    } else {
      alert("Wrong password");
    }
  }

  function lockAdmin() {
    localStorage.removeItem("fnd-admin-unlocked");
    setIsAdmin(false);
  }

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

      const cleanedEntries = Array.isArray(data)
        ? (data as FndEntry[]).map((entry) => ({
            ...entry,
            legs_json: Array.isArray(entry.legs_json)
              ? entry.legs_json.map((leg) => ({
                  ...leg,
                  status: leg.status || "pending",
                }))
              : [],
          }))
        : [];

      setEntries(cleanedEntries);
    } catch (err) {
      setEntries([]);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleEntry(id: string) {
    setOpenEntryId((prev) => (prev === id ? null : id));
  }

  async function updateLegStatus(
    entryId: string,
    legIndex: number,
    newStatus: LegStatus
  ) {
    if (!isAdmin) return;

    const saveKey = `${entryId}-${legIndex}`;
    setSavingLeg(saveKey);
    setError("");

    const entry = entries.find((item) => item.id === entryId);
    if (!entry) {
      setSavingLeg(null);
      return;
    }

    const updatedLegs = entry.legs_json.map((leg, index) =>
      index === legIndex ? { ...leg, status: newStatus } : leg
    );

    setEntries((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, legs_json: updatedLegs } : item
      )
    );

    const { error } = await supabase
      .from("fnd-bets")
      .update({ legs_json: updatedLegs })
      .eq("id", entryId);

    if (error) {
      setError(error.message || "Failed to save result.");
      loadEntries();
    }

    setSavingLeg(null);
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

              <div className="flex gap-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={lockAdmin}
                    className="inline-flex h-11 items-center justify-center rounded-[14px] border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700"
                  >
                    Admin On
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={unlockAdmin}
                    className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#d6e2ec] bg-white px-4 text-sm font-extrabold text-[#0a2d4f]"
                  >
                    Admin
                  </button>
                )}

                <Link
                  href="/fnd"
                  className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#d6e2ec] bg-white px-4 text-sm font-extrabold text-[#0a2d4f]"
                >
                  Back
                </Link>
              </div>
            </div>
          </div>

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
              <div className="mb-4 rounded-[16px] border border-red-200 bg-red-50 p-4">
                <div className="text-lg font-extrabold text-red-700">Error</div>
                <div className="mt-1 text-sm font-semibold text-red-600">
                  {error}
                </div>
              </div>
            ) : null}

            {loading ? (
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
                  const parlayStatus = getParlayStatus(entry.legs_json);
                  const legHitCount = getLegHitCount(entry.legs_json);

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

                          <div
                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusStyles(
                              parlayStatus
                            )}`}
                          >
                            {parlayText(parlayStatus, legHitCount)}
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
                              const currentStatus = leg.status || "pending";
                              const saveKey = `${entry.id}-${legIndex}`;
                              const isSaving = savingLeg === saveKey;

                              return (
                                <div
                                  key={`${entry.id}-${legIndex}`}
                                  className="rounded-[12px] border border-[#dce7f0] bg-white px-3 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
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

                                    <div
                                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${statusStyles(
                                        currentStatus
                                      )}`}
                                    >
                                      {isSaving ? "SAVING..." : statusText(currentStatus)}
                                    </div>
                                  </div>

                                  {isAdmin ? (
                                    <div className="mt-3 grid grid-cols-4 gap-2">
                                      {(["hit", "miss", "pending", "void"] as LegStatus[]).map(
                                        (status) => (
                                          <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                              updateLegStatus(
                                                entry.id,
                                                legIndex,
                                                status
                                              )
                                            }
                                            className={`rounded-[10px] border px-3 py-2 text-xs font-black transition ${
                                              currentStatus === status
                                                ? `${statusStyles(
                                                    status
                                                  )} ring-2 ring-[#0a2d4f]/20`
                                                : "border-[#dce7f0] bg-[#f7fafc] text-[#0a2d4f] hover:bg-[#edf4f9]"
                                            }`}
                                          >
                                            {statusText(status)}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  ) : null}
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