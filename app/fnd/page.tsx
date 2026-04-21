"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import Image from "next/image";
import nilmaLogo from "./nilma.png";
import bunyipLogo from "./bunyip.png";
import playerMarkets from "@/app/data/fnd_players";
import { supabase } from "@/lib/supabase";
import {
  matchInfo,
  categoryOrder,
  categories as baseCategories,
  type CategoryKey,
  type FndCategory,
} from "@/app/data/fnd_markets";

type FndPlayer = {
  id: string;
  name: string;
  number?: number;
  anytime_goal_scorer: number;
  two_plus_goals: number;
  three_plus_goals: number;
  four_plus_goals: number;
  five_plus_goals: number;
  six_plus_goals: number;
  seven_plus_goals: number;
  eight_plus_goals: number;
  best_on_ground: number;
  best_6_players: number;
  not_in_best_6_players: number;
  to_not_kick_a_goal: number;
  first_goal_scorer: number;
};

type Selection = {
  id: string;
  label: string;
  odds: number;
};

type Category = {
  label: string;
  layout: "two-column" | "player-grid";
  selections: Selection[];
};

type BetLeg = {
  categoryKey: CategoryKey;
  categoryLabel: string;
  selectionId: string;
  selectionLabel: string;
  odds: number;
};

type Entry = {
  id: string;
  userName: string;
  legs: BetLeg[];
  totalOdds: number;
  createdAt: string;
};

type SupabaseFndEntry = {
  id: string;
  match_id: string;
  user_name: string;
  total_odds: number | string;
  legs_json: BetLeg[];
  created_at: string;
};

const NAME_STORAGE_KEY = "fnd_name_local_v3";
const MAX_LEGS = 10;
const getDeviceSubmittedKey = (matchId: string) => `fnd_device_submitted_${matchId}`;

const TEAM_RESULT_CATEGORIES: CategoryKey[] = [
  "head_to_head",
  "big_win_little_win",
  "line",
];

const POSITIVE_GOAL_CATEGORIES: CategoryKey[] = [
  "anytime_goal_scorer",
  "two_plus_goals",
  "three_plus_goals",
  "four_plus_goals",
  "five_plus_goals",
  "six_plus_goals",
  "seven_plus_goals",
  "eight_plus_goals",
  "first_goal_scorer",
];

function formatOdds(value: number) {
  return value.toFixed(2);
}

function getGoalRank(categoryKey: CategoryKey) {
  const ranks: Partial<Record<CategoryKey, number>> = {
    anytime_goal_scorer: 1,
    two_plus_goals: 2,
    three_plus_goals: 3,
    four_plus_goals: 4,
    five_plus_goals: 5,
    six_plus_goals: 6,
    seven_plus_goals: 7,
    eight_plus_goals: 8,
  };

  return ranks[categoryKey] ?? null;
}

function getSelectionLogo(selectionLabel: string) {
  const lower = selectionLabel.toLowerCase();

  if (lower.includes("bunyip")) return bunyipLogo;
  if (lower.includes("nilma")) return nilmaLogo;

  return nilmaLogo;
}

function getSelectionLogoAlt(selectionLabel: string) {
  const lower = selectionLabel.toLowerCase();

  if (lower.includes("bunyip")) return "Bunyip";
  if (lower.includes("nilma")) return "Nilma-Darnum";

  return "Nilma-Darnum";
}

function sortEntries(entries: Entry[]) {
  return [...entries].sort((a, b) => {
    if (b.totalOdds !== a.totalOdds) return b.totalOdds - a.totalOdds;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function calculateMultiOdds(legs: BetLeg[]) {
  if (legs.length === 0) return 0;
  return legs.reduce((acc, leg) => acc * leg.odds, 1);
}

function buildPlayerSelections(
  players: FndPlayer[],
  key: keyof FndPlayer
): Selection[] {
  return players
    .filter(
      (player) => typeof player[key] === "number" && Number(player[key]) > 0
    )
    .map((player) => ({
      id: `${String(key)}_${player.id}`,
      label: `${player.number ? `${player.number} ` : ""}${player.name}`,
      odds: Number(player[key]),
    }))
    .sort((a, b) => a.odds - b.odds);
}

function getCategoryLabel(categoryKey: CategoryKey) {
  const labels: Record<CategoryKey, string> = {
    head_to_head: "Head to Head",
    big_win_little_win: "Big Win Little Win",
    line: "Line",
    anytime_goal_scorer: "Anytime Goal Scorer",
    two_plus_goals: "2+ Goals",
    three_plus_goals: "3+ Goals",
    four_plus_goals: "4+ Goals",
    five_plus_goals: "5+ Goals",
    six_plus_goals: "6+ Goals",
    seven_plus_goals: "7+ Goals",
    eight_plus_goals: "8+ Goals",
    best_on_ground: "Best on Ground",
    best_6_players: "Best 6 Players",
    not_in_best_6_players: "Not in Best 6 Players",
    to_not_kick_a_goal: "To Not Kick a Goal",
    first_goal_scorer: "First Goal Scorer",
     other: "Other",
  };

  return labels[categoryKey];
}

function isPlayerCategory(category: FndCategory | Category) {
  return category.layout === "player-grid";
}

function getTeamFromSelectionLabel(label: string): "nilma" | "bunyip" | null {
  const lower = label.toLowerCase();

  if (lower.includes("nilma")) return "nilma";
  if (lower.includes("bunyip")) return "bunyip";

  return null;
}

function normalisePlayerName(label: string) {
  return label
    .replace(/^\d+\s*/, "")
    .trim()
    .toLowerCase();
}

function isTeamResultLeg(leg: BetLeg) {
  return TEAM_RESULT_CATEGORIES.includes(leg.categoryKey);
}

function isPositiveGoalLeg(leg: BetLeg) {
  return POSITIVE_GOAL_CATEGORIES.includes(leg.categoryKey);
}

function isNoGoalLeg(leg: BetLeg) {
  return leg.categoryKey === "to_not_kick_a_goal";
}

function getConflictMessage(newLeg: BetLeg, existingLegs: BetLeg[]) {
  // TEAM RESULT CONFLICTS
  if (isTeamResultLeg(newLeg)) {
    const newTeam = getTeamFromSelectionLabel(newLeg.selectionLabel);

    if (newTeam) {
      for (const leg of existingLegs) {
        if (!isTeamResultLeg(leg)) continue;

        const existingTeam = getTeamFromSelectionLabel(leg.selectionLabel);
        if (!existingTeam) continue;

        // Prevent same-team result combinations across result categories
        // Example: Nilma H2H + Nilma 50+
        if (existingTeam === newTeam) {
          return "You can't combine multiple win-result bets for the same team.";
        }

        // Prevent opposite-team result combinations
        // Example: Nilma to win + Bunyip to win
        if (existingTeam !== newTeam) {
          return "You can't bet on both Nilma-Darnum and Bunyip to win.";
        }
      }
    }
  }

  // PLAYER GOAL CONFLICTS
  if (isPositiveGoalLeg(newLeg) || isNoGoalLeg(newLeg)) {
    const newPlayer = normalisePlayerName(newLeg.selectionLabel);

    for (const leg of existingLegs) {
      const existingPlayer = normalisePlayerName(leg.selectionLabel);

      if (existingPlayer !== newPlayer) continue;

      const newIsPositive = isPositiveGoalLeg(newLeg);
      const newIsNoGoal = isNoGoalLeg(newLeg);
      const existingIsPositive = isPositiveGoalLeg(leg);
      const existingIsNoGoal = isNoGoalLeg(leg);

      if (
        (newIsPositive && existingIsNoGoal) ||
        (newIsNoGoal && existingIsPositive)
      ) {
        return "You can't combine a player goal bet with that same player to not kick a goal.";
      }
    }
  }

  return null;
}

export default function FndPage() {
  const players = playerMarkets as FndPlayer[];

  const categories = useMemo<Record<CategoryKey, Category>>(() => {
    return {
      ...baseCategories,

      anytime_goal_scorer: {
        label: "Anytime Goal Scorer",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "anytime_goal_scorer"),
      },

      two_plus_goals: {
        label: "2+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "two_plus_goals"),
      },

      three_plus_goals: {
        label: "3+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "three_plus_goals"),
      },

      four_plus_goals: {
        label: "4+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "four_plus_goals"),
      },

      five_plus_goals: {
        label: "5+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "five_plus_goals"),
      },

      six_plus_goals: {
        label: "6+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "six_plus_goals"),
      },

      seven_plus_goals: {
        label: "7+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "seven_plus_goals"),
      },

      eight_plus_goals: {
        label: "8+ Goals",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "eight_plus_goals"),
      },

      best_on_ground: {
        label: "Best on Ground",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "best_on_ground"),
      },

      best_6_players: {
        label: "Best 6 Players",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "best_6_players"),
      },

      not_in_best_6_players: {
        label: "Not in Best 6 Players",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "not_in_best_6_players"),
      },

      to_not_kick_a_goal: {
        label: "To Not Kick a Goal",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "to_not_kick_a_goal"),
      },

      first_goal_scorer: {
        label: "First Nilma Goal Scorer",
        layout: "player-grid",
        selections: buildPlayerSelections(players, "first_goal_scorer"),
      },
    };
  }, [players]);

  const [expandedCategories, setExpandedCategories] = useState<CategoryKey[]>([
    "head_to_head",
    "anytime_goal_scorer",
  ]);
  const [betSlip, setBetSlip] = useState<BetLeg[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceAlreadySubmitted, setDeviceAlreadySubmitted] = useState(false);

  useEffect(() => {
    async function loadEntries() {
      try {
        const savedName = localStorage.getItem(NAME_STORAGE_KEY);
        if (savedName) setUserName(savedName);

        const submittedKey = getDeviceSubmittedKey(matchInfo.id);
        const alreadySubmitted = localStorage.getItem(submittedKey) === "true";
        setDeviceAlreadySubmitted(alreadySubmitted);

        const { data, error } = await supabase
          .from("fnd-bets")
          .select("*")
          .eq("match_id", matchInfo.id)
          .order("total_odds", { ascending: false })
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data)) {
          const mapped: Entry[] = (data as SupabaseFndEntry[]).map((entry) => ({
            id: entry.id,
            userName: entry.user_name,
            legs: Array.isArray(entry.legs_json) ? entry.legs_json : [],
            totalOdds: Number(entry.total_odds),
            createdAt: entry.created_at,
          }));

          setEntries(mapped);
        }
      } catch {}
    }

    loadEntries();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NAME_STORAGE_KEY, userName);
    } catch {}
  }, [userName]);

  const sortedEntries = useMemo(() => sortEntries(entries), [entries]);
  const totalOdds = useMemo(() => calculateMultiOdds(betSlip), [betSlip]);

  function toggleCategory(categoryKey: CategoryKey) {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((key) => key !== categoryKey)
        : [...prev, categoryKey]
    );
  }

  function isSelectionInSlip(selectionId: string) {
    return betSlip.some((leg) => leg.selectionId === selectionId);
  }

  function getGoalRank(categoryKey: CategoryKey) {
  const ranks: Partial<Record<CategoryKey, number>> = {
    anytime_goal_scorer: 1,
    two_plus_goals: 2,
    three_plus_goals: 3,
    four_plus_goals: 4,
    five_plus_goals: 5,
    six_plus_goals: 6,
    seven_plus_goals: 7,
    eight_plus_goals: 8,
  };

  return ranks[categoryKey] ?? null;
}

function toggleLeg(categoryKey: CategoryKey, selection: Selection) {
  const alreadyExists = betSlip.some((leg) => leg.selectionId === selection.id);

  if (alreadyExists) {
    setBetSlip((prev) => prev.filter((leg) => leg.selectionId !== selection.id));
    setMessage("");
    return;
  }

  if (betSlip.length >= MAX_LEGS) {
    setMessage("Maximum 10 legs.");
    return;
  }

  const newLeg: BetLeg = {
    categoryKey,
    categoryLabel: getCategoryLabel(categoryKey),
    selectionId: selection.id,
    selectionLabel: selection.label,
    odds: selection.odds,
  };

  const conflictMessage = getConflictMessage(newLeg, betSlip);

  if (conflictMessage) {
    setMessage(conflictMessage);
    return;
  }

  const newGoalRank = getGoalRank(categoryKey);
  const newPlayerName = normalisePlayerName(selection.label);

  if (newGoalRank !== null) {
    setBetSlip((prev) => {
      const filtered = prev.filter((leg) => {
        const existingGoalRank = getGoalRank(leg.categoryKey);
        if (existingGoalRank === null) return true;

        const existingPlayerName = normalisePlayerName(leg.selectionLabel);
        return existingPlayerName !== newPlayerName;
      });

      return [...filtered, newLeg];
    });

    setMessage("");
    return;
  }

  setBetSlip((prev) => [...prev, newLeg]);
  setMessage("");
}

  function removeLeg(selectionId: string) {
    setBetSlip((prev) => prev.filter((leg) => leg.selectionId !== selectionId));
    setMessage("");
  }

  function clearSlip() {
    setBetSlip([]);
    setMessage("");
  }
  
  

  async function submitEntry() {
    const trimmedName = userName.trim();

    if (!trimmedName) {
      setMessage("Enter your name first.");
      return;
    }

    if (betSlip.length === 0) {
      setMessage("Add at least 1 leg.");
      return;
    }

    if (deviceAlreadySubmitted) {
      setMessage("This device has already submitted a bet.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("Submitting...");

      const { data, error } = await supabase
        .from("fnd-bets")
        .insert([
          {
            match_id: matchInfo.id,
            user_name: trimmedName,
            total_odds: totalOdds,
            legs_json: betSlip,
          },
        ])
        .select()
        .single();

      if (error || !data) {
        setMessage(error?.message || "Failed to submit bet.");
        return;
      }

      const inserted = data as SupabaseFndEntry;

      const newEntry: Entry = {
        id: inserted.id,
        userName: inserted.user_name,
        legs: Array.isArray(inserted.legs_json) ? inserted.legs_json : [],
        totalOdds: Number(inserted.total_odds),
        createdAt: inserted.created_at,
      };

      setEntries((prev) => sortEntries([...prev, newEntry]));
      setBetSlip([]);

      try {
        localStorage.setItem(getDeviceSubmittedKey(matchInfo.id), "true");
      } catch {}

      setDeviceAlreadySubmitted(true);
      setMessage("Bet submitted.");
    } catch {
      setMessage("Failed to submit bet.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef3f7] text-[#0a2d4f]">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="overflow-hidden rounded-[22px] border border-[#c9d7e4] bg-white shadow-[0_10px_30px_rgba(13,43,73,0.08)]">
          <div className="border-b border-[#dbe5ee] bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6e88a3]">
                  Nilma-Darnum
                </div>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  FND MODE
                </h1>

                <div className="mt-4 flex items-center gap-4 rounded-[18px] border border-[#d7e2ec] bg-[#f4f8fb] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white">
                      <Image
                        src={nilmaLogo}
                        alt="Nilma-Darnum"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#6c88a2]">Home</div>
                      <div className="text-lg font-extrabold text-[#0a2d4f]">
                        Nilma-Darnum
                      </div>
                    </div>
                  </div>

                  <div className="text-xl font-black text-[#0a5fb4]">vs</div>

                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white">
                      <Image
                        src={bunyipLogo}
                        alt="Bunyip"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#6c88a2]">Opponent</div>
                      <div className="text-lg font-extrabold text-[#0a2d4f]">
                        Bunyip
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm font-semibold text-[#55708a]">
                  {matchInfo.round} • {matchInfo.venue}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d7e2ec] bg-[#f4f8fb] px-4 py-3">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6c88a2]">
                  Rule
                </div>
                <div className="mt-1 text-sm font-bold text-[#0a2d4f]">
                  Each device can submit only 1 bet.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-3 lg:grid-cols-[1.55fr_0.95fr] sm:p-4">
            <section className="space-y-3">
              {categoryOrder.map((categoryKey) => {
                const category = categories[categoryKey];
                const expanded = expandedCategories.includes(categoryKey);

                if (!category || category.selections.length === 0) return null;

                return (
                  <div
                    key={categoryKey}
                    className="overflow-hidden rounded-[18px] border border-[#d6e2ec] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryKey)}
                      className="flex w-full items-center justify-between gap-3 bg-white px-4 py-4 text-left transition hover:bg-[#f7fafc]"
                    >
                      <div className="text-base font-extrabold sm:text-lg">
                        {category.label}
                      </div>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-[#0a5fb4] transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expanded && (
                      <div className="border-t border-[#dfe8f0] bg-[#fbfdff] p-3 sm:p-4">
                        {isPlayerCategory(category) ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {category.selections.map((selection) => {
                              const selected = isSelectionInSlip(selection.id);

                              return (
                                <button
                                  key={selection.id}
                                  type="button"
                                  onClick={() => toggleLeg(categoryKey, selection)}
                                  className="group flex items-center justify-between gap-3 rounded-[16px] border border-[#d6e2ec] bg-white px-3 py-3 text-left transition duration-150 hover:-translate-y-[1px] hover:border-[#b7cadb] hover:bg-[#f7fafc] hover:shadow-[0_8px_20px_rgba(13,43,73,0.08)] active:scale-[0.985]"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-[#d6e2ec]">
                                      <Image
                                        src={nilmaLogo}
                                        alt="Nilma-Darnum"
                                        fill
                                        className="object-contain p-1"
                                      />
                                    </div>

                                    <div className="min-w-0">
                                      <div className="truncate text-[15px] font-extrabold text-[#0a2d4f]">
                                        {selection.label}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`shrink-0 rounded-[12px] border px-4 py-3 text-lg font-black transition ${
                                      selected
                                        ? "border-[#0a5fb4] bg-[#0a5fb4] text-white"
                                        : "border-[#b5cadc] bg-[#edf3f8] text-[#0a2d4f] group-hover:bg-[#e5eef6]"
                                    }`}
                                  >
                                    {formatOdds(selection.odds)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {category.selections.map((selection) => {
                              const selected = isSelectionInSlip(selection.id);

                              return (
                                <button
                                  key={selection.id}
                                  type="button"
                                  onClick={() => toggleLeg(categoryKey, selection)}
                                  className="group flex items-center justify-between rounded-[16px] border border-[#d6e2ec] bg-white px-4 py-4 text-left transition duration-150 hover:-translate-y-[1px] hover:border-[#b7cadb] hover:bg-[#f7fafc] hover:shadow-[0_8px_20px_rgba(13,43,73,0.08)] active:scale-[0.985]"
                                >
                                  <div className="flex items-center gap-3 pr-3">
                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-[#d6e2ec]">
                                      <Image
                                        src={getSelectionLogo(selection.label)}
                                        alt={getSelectionLogoAlt(selection.label)}
                                        fill
                                        className="object-contain p-1"
                                      />
                                    </div>

                                    <div className="text-[15px] font-extrabold text-[#0a2d4f]">
                                      {selection.label}
                                    </div>
                                  </div>

                                  <div
                                    className={`shrink-0 rounded-[12px] border px-4 py-3 text-lg font-black transition ${
                                      selected
                                        ? "border-[#0a5fb4] bg-[#0a5fb4] text-white"
                                        : "border-[#b5cadc] bg-[#edf3f8] text-[#0a2d4f] group-hover:bg-[#e5eef6]"
                                    }`}
                                  >
                                    {formatOdds(selection.odds)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            <aside className="space-y-3">
              <div className="rounded-[18px] border border-[#d6e2ec] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6c88a2]">
                      Bet Slip
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-[#0a2d4f]">
                      {betSlip.length} / {MAX_LEGS} Legs
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearSlip}
                    className="rounded-[12px] border border-[#d6e2ec] bg-[#f7fafc] px-3 py-2 text-xs font-extrabold text-[#58738d] transition hover:bg-[#eef4f8]"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-bold text-[#56718b]">Name</label>
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value.slice(0, 20))}
                    placeholder="Enter your name"
                    className="mt-2 h-12 w-full rounded-[14px] border border-[#d6e2ec] bg-[#fbfdff] px-4 text-[#0a2d4f] outline-none transition focus:border-[#9eb8cd]"
                  />
                </div>

                {deviceAlreadySubmitted ? (
                  <div className="mt-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    This device has already submitted a bet for this match.
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  {betSlip.length === 0 ? (
                    <div className="rounded-[14px] border border-[#dce7f0] bg-[#f7fafc] p-4 text-sm font-semibold text-[#6d869d]">
                      No legs added yet.
                    </div>
                  ) : (
                    betSlip.map((leg, index) => (
                      <div
                        key={leg.selectionId}
                        className="rounded-[14px] border border-[#dce7f0] bg-[#f7fafc] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-[#0a5fb4]">
                              Leg {index + 1}
                            </div>

                            <div className="mt-1 flex items-center gap-2">
                              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-[#d6e2ec]">
                                <Image
                                  src={getSelectionLogo(leg.selectionLabel)}
                                  alt={getSelectionLogoAlt(leg.selectionLabel)}
                                  fill
                                  className="object-contain p-1"
                                />
                              </div>

                              <div className="text-base font-extrabold text-[#0a2d4f]">
                                {leg.selectionLabel}
                              </div>
                            </div>

                            <div className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7b93aa]">
                              {leg.categoryLabel}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="shrink-0 rounded-[12px] border border-[#b5cadc] bg-[#edf3f8] px-4 py-3 text-lg font-black text-[#0a2d4f]">
                              {formatOdds(leg.odds)}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeLeg(leg.selectionId)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#d6e2ec] bg-white text-[#6d869d] transition hover:bg-[#f3f7fa] active:scale-[0.96]"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 rounded-[16px] border border-[#dce7f0] bg-[#f7fafc] p-4">
                  <div className="text-sm font-bold text-[#69849e]">Multi Odds</div>
                  <div className="mt-2 text-3xl font-black text-[#0a2d4f]">
                    {betSlip.length > 0 ? formatOdds(totalOdds) : "0.00"}
                  </div>
                </div>

                <button
                  onClick={submitEntry}
                  disabled={isSubmitting || deviceAlreadySubmitted}
                  className={`mt-4 h-12 w-full rounded-[14px] text-base font-extrabold text-white transition duration-150 ${
                    isSubmitting || deviceAlreadySubmitted
                      ? "cursor-not-allowed bg-[#8fb2d6]"
                      : "bg-[#0a5fb4] hover:bg-[#08539d] active:scale-[0.99]"
                  }`}
                >
                  {deviceAlreadySubmitted
                    ? "Already Submitted"
                    : isSubmitting
                    ? "Submitting..."
                    : "Submit Bet"}
                </button>

                <Link
                  href="/fnd/leaderboard"
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-[14px] border border-[#d6e2ec] bg-white text-base font-extrabold text-[#0a2d4f] transition duration-150 hover:bg-[#f7fafc]"
                >
                  View Leaderboard
                </Link>

                {message ? (
                  <div className="mt-3 text-sm font-semibold text-[#5e7992]">
                    {message}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[18px] border border-[#d6e2ec] bg-white p-4">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6c88a2]">
                  Entries
                </div>
                <div className="mt-1 text-lg font-extrabold text-[#0a2d4f]">
                  Highest Bet Odds First
                </div>

                <div className="mt-4 space-y-2">
                  {sortedEntries.length === 0 ? (
                    <div className="rounded-[14px] border border-[#dce7f0] bg-[#f7fafc] p-4 text-sm font-semibold text-[#6d869d]">
                      No entries yet.
                    </div>
                  ) : (
                    sortedEntries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="rounded-[14px] border border-[#dce7f0] bg-[#f7fafc] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-[#0a5fb4]">
                              #{index + 1}
                            </div>
                            <div className="truncate text-base font-extrabold text-[#0a2d4f]">
                              {entry.userName}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[#617c95]">
                              {entry.legs.length} legs
                            </div>
                          </div>

                          <div className="shrink-0 rounded-[12px] border border-[#b5cadc] bg-[#edf3f8] px-4 py-3 text-lg font-black text-[#0a2d4f]">
                            {formatOdds(entry.totalOdds)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}