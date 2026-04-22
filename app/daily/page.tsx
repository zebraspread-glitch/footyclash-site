"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import players2026 from "@/app/data/afl_players26.json";
import SideBanner160 from "@/app/components/SideBanner160";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type SlotPos = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";

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

type Slot = {
  id: string;
  label: SlotPos;
  allowed: PlayerPos[];
};

type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];
  stats: Record<StatMode, number>;
};

type RawPlayer2026 = {
  id?: string | number;
  name?: string;
  fullName?: string;
  player?: string;
  playerName?: string;
  club?: string;
  team?: string;
  pos?: PlayerPos[] | string;
  position?: PlayerPos[] | string;
  positions?: PlayerPos[] | string;
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
  [key: string]: unknown;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
  logo: string;
};

type ActivePicker = {
  slotId: string;
  allowed: PlayerPos[];
  slotLabel: SlotPos;
};

type ModeOption = {
  key: StatMode;
  label: string;
  short: string;
};

type DailySave = {
  dateKey: string;
  mode: StatMode;
  team: Record<string, string | null>;
  finished: boolean;
  score: number;
};

type DailyHistoryEntry = {
  dateKey: string;
  percent: number;
  score: number;
  bestScore: number;
  label: string;
};

/** ================= Slots ================= */
const DAILY_SLOTS: Slot[] = [
  { id: "fwd", label: "FWD", allowed: ["FWD"] },
  { id: "mid", label: "MID", allowed: ["MID"] },
  { id: "def", label: "DEF", allowed: ["DEF"] },
  { id: "ruck", label: "RUCK", allowed: ["RUCK"] },
  { id: "flex", label: "FLEX", allowed: ["FWD", "MID", "DEF", "RUCK"] },
];

/** ================= Modes ================= */
const DAILY_MODE_POOL: ModeOption[] = [
  { key: "sc_points", label: "SC Points", short: "SC" },
  { key: "disposals", label: "Disposals", short: "DISP" },
  { key: "goals", label: "Goals", short: "GOALS" },
  { key: "bounces", label: "Bounces", short: "BOUN" },
];

const MODE_OPTIONS: ModeOption[] = [
  { key: "age", label: "Age", short: "AGE" },
  { key: "number", label: "Jumper Number", short: "#" },
  { key: "disposals", label: "Disposals", short: "DISP" },
  { key: "goals", label: "Goals", short: "GOALS" },
  { key: "kicks", label: "Kicks", short: "KICKS" },
  { key: "handballs", label: "Handballs", short: "HB" },
  { key: "marks", label: "Marks", short: "MARKS" },
  { key: "tackles", label: "Tackles", short: "TACK" },
  { key: "hitouts", label: "Hitouts", short: "HO" },
  { key: "sc_points", label: "SC Points", short: "FPTS" },
  { key: "bounces", label: "Bounces", short: "BOUN" },
  { key: "metres_gained", label: "Metres Gained", short: "MG" },
];

/** ================= Clubs ================= */
const AFL_CLUBS: ClubMeta[] = [
  { name: "Collingwood", primary: "#000000", text: "#FFFFFF", logo: "/team-logos/magpies.png" },
  { name: "Carlton", primary: "#001B4D", text: "#FFFFFF", logo: "/team-logos/blues.png" },
  { name: "Richmond", primary: "#F7B500", text: "#111111", logo: "/team-logos/tigers.png" },
  { name: "Essendon", primary: "#C8102E", text: "#FFFFFF", logo: "/team-logos/bombers.png" },
  { name: "Geelong", primary: "#0F2A4A", text: "#FFFFFF", logo: "/team-logos/cats.png" },
  { name: "Hawthorn", primary: "#4B2E1E", text: "#FFFFFF", logo: "/team-logos/hawks.png" },
  { name: "Melbourne", primary: "#0A2A5E", text: "#FFFFFF", logo: "/team-logos/demons.png" },
  { name: "Sydney", primary: "#E41E2B", text: "#FFFFFF", logo: "/team-logos/swans.png" },
  { name: "Brisbane", primary: "#7C003E", text: "#FFD200", logo: "/team-logos/lions.png" },
  { name: "West Coast", primary: "#002B5C", text: "#FFD200", logo: "/team-logos/eagles.png" },
  { name: "Fremantle", primary: "#2B0A3D", text: "#FFFFFF", logo: "/team-logos/dockers.png" },
  { name: "Adelaide", primary: "#002B5C", text: "#E41E2B", logo: "/team-logos/crows.png" },
  { name: "Port Adelaide", primary: "#00A1DE", text: "#111111", logo: "/team-logos/power.png" },
  { name: "St Kilda", primary: "#C8102E", text: "#000000", logo: "/team-logos/saints.png" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF", logo: "/team-logos/bulldogs.png" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF", logo: "/team-logos/kangaroos.png" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200", logo: "/team-logos/suns.png" },
  { name: "GWS", primary: "#F15A22", text: "#111111", logo: "/team-logos/giants.png" },
];

/** ================= Helpers ================= */
function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizePositions(value: unknown): PlayerPos[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is PlayerPos =>
        v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
    );
  }

  if (typeof value === "string") {
    const parts = value
      .split(/[\/,| ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);

    const mapped = parts
      .map((p) => (p === "RUC" ? "RUCK" : p))
      .filter(
        (v): v is PlayerPos =>
          v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
      );

    if (mapped.length) return mapped;
  }

  return ["MID"];
}

function normalize2026Players(data: unknown): Player[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { players?: unknown[] })?.players)
    ? (data as { players: unknown[] }).players
    : [];

  return (list as RawPlayer2026[])
    .map((p, index) => {
      const name =
        (typeof p.name === "string" && p.name) ||
        (typeof p.fullName === "string" && p.fullName) ||
        (typeof p.player === "string" && p.player) ||
        (typeof p.playerName === "string" && p.playerName) ||
        `Player ${index + 1}`;

      const club =
        (typeof p.club === "string" && p.club) ||
        (typeof p.team === "string" && p.team) ||
        "";

      const pos = normalizePositions(p.pos ?? p.position ?? p.positions);

      const id =
        p.id != null && String(p.id).trim().length > 0
          ? String(p.id)
          : `${name}-${club}-${index}`;

      return {
        id,
        name,
        club,
        pos,
        stats: {
          age: parseNumber(p.age),
          number: parseNumber(p.number),
          disposals: parseNumber(p.disposals),
          goals: parseNumber(p.goals),
          kicks: parseNumber(p.kicks),
          handballs: parseNumber(p.handballs),
          marks: parseNumber(p.marks),
          tackles: parseNumber(p.tackles),
          hitouts: parseNumber(p.hitouts),
          sc_points: parseNumber(p.sc_points),
          bounces: parseNumber(p.bounces),
          metres_gained: parseNumber(p.metres_gained),
        },
      };
    })
    .filter((p) => p.name && p.club);
}

function createEmptyTeam(slots: Slot[]): Record<string, string | null> {
  return Object.fromEntries(slots.map((slot) => [slot.id, null])) as Record<
    string,
    string | null
  >;
}

function clampClubsToPlayers(clubs: ClubMeta[], players: Player[]) {
  const available = new Set(players.map((p) => p.club));
  return clubs.filter((c) => available.has(c.name));
}

function getClubMeta(clubName: string) {
  return AFL_CLUBS.find((club) => club.name === clubName) ?? null;
}

function getModeMeta(mode: StatMode) {
  return MODE_OPTIONS.find((option) => option.key === mode) ?? MODE_OPTIONS[0];
}

function formatStatValue(value: number, mode: StatMode) {
  if (
    mode === "age" ||
    mode === "number" ||
    mode === "goals" ||
    mode === "bounces" ||
    mode === "metres_gained" ||
    mode === "hitouts"
  ) {
    return String(Math.round(value));
  }

  return value.toFixed(1);
}

function hasEligiblePlayersForSlot(
  allPlayers: Player[],
  pickedIds: Set<string>,
  slot: Slot,
  clubName: string,
  mode: StatMode
) {
  return allPlayers.some(
    (p) =>
      p.club === clubName &&
      p.stats[mode] > 0 &&
      !pickedIds.has(p.id) &&
      p.pos.some((pos) => slot.allowed.includes(pos))
  );
}

function sumModeStat(
  team: Record<string, string | null>,
  getById: (id: string | null) => Player | null,
  mode: StatMode
) {
  let total = 0;

  for (const slotId of Object.keys(team)) {
    const player = getById(team[slotId]);
    if (player) total += player.stats[mode] ?? 0;
  }

  return total;
}

function getLocalDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDisplayDateLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

function seededNumberFromString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function getDailyMode(dateKey: string): StatMode {
  const seed = seededNumberFromString(`daily-mode-${dateKey}`);
  return DAILY_MODE_POOL[seed % DAILY_MODE_POOL.length].key;
}

function getDailyClubOrder(dateKey: string, clubs: ClubMeta[]) {
  const keyed = clubs.map((club) => ({
    club,
    value: seededNumberFromString(`${dateKey}-${club.name}`),
  }));

  keyed.sort((a, b) => a.value - b.value);
  return keyed.slice(0, DAILY_SLOTS.length).map((item) => item.club);
}

function getEligibleDailyClubsForMode(allPlayers: Player[], mode: StatMode) {
  const clubs = clampClubsToPlayers(
    AFL_CLUBS,
    allPlayers.filter((p) => p.stats[mode] > 0)
  );
  return clubs.length > 0 ? clubs : AFL_CLUBS;
}

function getDailyClubOrderForModeAndDate(
  allPlayers: Player[],
  mode: StatMode,
  dateKey: string
) {
  return getDailyClubOrder(dateKey, getEligibleDailyClubsForMode(allPlayers, mode));
}

function getDailyStorageKey(dateKey: string) {
  return `daily_game_state_${dateKey}`;
}

function saveDailyState(payload: DailySave) {
  try {
    localStorage.setItem(getDailyStorageKey(payload.dateKey), JSON.stringify(payload));
  } catch {}
}

function loadDailyState(dateKey: string): DailySave | null {
  try {
    const raw = localStorage.getItem(getDailyStorageKey(dateKey));
    if (!raw) return null;
    return JSON.parse(raw) as DailySave;
  } catch {
    return null;
  }
}

function buildBestTeamForSlots(
  allPlayers: Player[],
  slots: Slot[],
  mode: StatMode,
  allowedClubs?: string[]
): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  if (!allowedClubs || allowedClubs.length === 0) {
    for (const slot of slots) result[slot.id] = null;
    return result;
  }

  const uniqueClubs = [...new Set(allowedClubs)];

  function getBestPlayerForClubAndSlot(clubName: string, slot: Slot, usedIds: Set<string>) {
    return allPlayers
      .filter((p) => p.club === clubName)
      .filter((p) => p.stats[mode] > 0)
      .filter((p) => !usedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => slot.allowed.includes(pos)))
      .sort((a, b) => b.stats[mode] - a.stats[mode])[0] ?? null;
  }

  let bestScore = -1;
  let bestTeam: Record<string, string | null> | null = null;

  function permute(arr: string[], start: number) {
    if (start === arr.length) {
      const usedIds = new Set<string>();
      const team: Record<string, string | null> = {};
      let total = 0;
      let valid = true;

      for (let i = 0; i < slots.length; i += 1) {
        const slot = slots[i];
        const clubName = arr[i];
        const player = getBestPlayerForClubAndSlot(clubName, slot, usedIds);

        if (!player) {
          valid = false;
          break;
        }

        team[slot.id] = player.id;
        usedIds.add(player.id);
        total += player.stats[mode] ?? 0;
      }

      if (valid && total > bestScore) {
        bestScore = total;
        bestTeam = team;
      }

      return;
    }

    for (let i = start; i < arr.length; i += 1) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permute(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  }

  if (uniqueClubs.length >= slots.length) {
    permute(uniqueClubs.slice(0, slots.length), 0);
  }

  if (bestTeam) return bestTeam;

  for (const slot of slots) result[slot.id] = null;
  return result;
}

function getPercentTier(percent: number) {
  if (percent >= 100) {
    return {
      label: "Perfect",
      textClass:
        "bg-[linear-gradient(135deg,#fff7bf_0%,#ffe066_35%,#f5c542_60%,#c78a18_100%)] bg-clip-text text-transparent",
      pillClass:
        "border-[#c78a18] bg-[linear-gradient(135deg,#fff1a6_0%,#ffd84d_45%,#e6ad1b_100%)] text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
    };
  }

  if (percent >= 90) {
    return {
      label: "Elite",
      textClass: "text-purple-500",
      pillClass: "border-purple-900 bg-purple-600 text-white",
    };
  }

  if (percent >= 80) {
    return {
      label: "Great",
      textClass: "text-green-900",
      pillClass: "border-green-950 bg-green-800 text-white",
    };
  }

  if (percent >= 65) {
    return {
      label: "Good",
      textClass: "text-lime-500",
      pillClass: "border-lime-700 bg-lime-400 text-black",
    };
  }

  if (percent >= 50) {
    return {
      label: "Mid",
      textClass: "text-orange-500",
      pillClass: "border-orange-700 bg-orange-400 text-black",
    };
  }

  return {
    label: "Bad",
    textClass: "text-red-500",
    pillClass: "border-red-800 bg-red-500 text-white",
  };
}

function formatHistoryDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
}

function getSavedDailyHistory(
  allPlayers: Player[],
  slots: Slot[]
): DailyHistoryEntry[] {
  if (typeof window === "undefined") return [];

  const entries: DailyHistoryEntry[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("daily_game_state_")) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = JSON.parse(raw) as DailySave;
      if (!saved?.dateKey || !saved?.mode || !saved?.team) continue;

      const clubsForThatDay = getDailyClubOrderForModeAndDate(
        allPlayers,
        saved.mode,
        saved.dateKey
      ).map((club) => club.name);

      const bestTeam = buildBestTeamForSlots(
        allPlayers,
        slots,
        saved.mode,
        clubsForThatDay
      );

      const getById = (id: string | null) =>
        allPlayers.find((p) => p.id === id) ?? null;

      const score = sumModeStat(saved.team, getById, saved.mode);
      const bestScore = sumModeStat(bestTeam, getById, saved.mode);
      const percent = bestScore > 0 ? (score / bestScore) * 100 : 0;
      const tier = getPercentTier(percent);

      entries.push({
        dateKey: saved.dateKey,
        percent,
        score,
        bestScore,
        label: tier.label,
      });
    } catch {}
  }

  entries.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return entries;
}

/** ================= Page ================= */
export default function DailyPage() {
  const ALL_PLAYERS = useMemo(() => normalize2026Players(players2026), []);
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const todayLabel = useMemo(() => getDisplayDateLabel(), []);
  const dailyMode = useMemo(() => getDailyMode(todayKey), [todayKey]);
  const slots = DAILY_SLOTS;

  const SPIN_CLUBS = useMemo(() => {
    const clubs = clampClubsToPlayers(
      AFL_CLUBS,
      ALL_PLAYERS.filter((p) => p.stats[dailyMode] > 0)
    );
    return clubs.length > 0 ? clubs : AFL_CLUBS;
  }, [ALL_PLAYERS, dailyMode]);

  const dailyClubOrder = useMemo(
    () => getDailyClubOrder(todayKey, SPIN_CLUBS),
    [todayKey, SPIN_CLUBS]
  );

  const dailyClubNames = useMemo(
    () => dailyClubOrder.map((club) => club.name),
    [dailyClubOrder]
  );

  const [team, setTeam] = useState<Record<string, string | null>>(() =>
    createEmptyTeam(slots)
  );
  const [active, setActive] = useState<ActivePicker | null>(null);
  const [search, setSearch] = useState("");
  const [draftIndex, setDraftIndex] = useState(0);
  const [club, setClub] = useState<ClubMeta>(dailyClubOrder[0] ?? AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(dailyClubOrder[0] ?? AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showBestTeam, setShowBestTeam] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<DailyHistoryEntry[]>([]);

  const spinTimer = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);
  const delayedSpinTimeout = useRef<number | null>(null);
  const spinRunId = useRef(0);

  const getPlayerById = (pid: string | null) => {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  };

  const pickedIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(team).forEach((id) => {
      if (id) ids.push(id);
    });
    return new Set(ids);
  }, [team]);

  const bestTeam = useMemo(() => {
    return buildBestTeamForSlots(ALL_PLAYERS, slots, dailyMode, dailyClubNames);
  }, [ALL_PLAYERS, slots, dailyMode, dailyClubNames]);

  const gameOver = useMemo(() => {
    const allFilled = slots.every((slot) => Boolean(team[slot.id]));
    return allFilled || locked;
  }, [team, locked, slots]);

  const displayedTeam = showBestTeam ? bestTeam : team;

  const currentScore = useMemo(() => {
    return sumModeStat(team, getPlayerById, dailyMode);
  }, [team, dailyMode]);

  const bestScore = useMemo(() => {
    return sumModeStat(bestTeam, getPlayerById, dailyMode);
  }, [bestTeam, dailyMode]);

  const emptySlots = useMemo(() => slots.filter((slot) => !team[slot.id]), [team]);

  const clubPlayers = useMemo(() => {
    return ALL_PLAYERS
      .filter((p) => p.club === club.name)
      .filter((p) => p.stats[dailyMode] > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ALL_PLAYERS, club.name, dailyMode]);

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return clubPlayers
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => active.allowed.includes(pos)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [active, clubPlayers, pickedIds, search]);

  const clubHasAnyValidPick = useMemo(() => {
    return emptySlots.some((slot) =>
      hasEligiblePlayersForSlot(ALL_PLAYERS, pickedIds, slot, club.name, dailyMode)
    );
  }, [emptySlots, club.name, pickedIds, ALL_PLAYERS, dailyMode]);

  const percent = bestScore > 0 ? (currentScore / bestScore) * 100 : 0;
  const currentTier = getPercentTier(percent);

  function refreshHistory() {
    setHistoryEntries(getSavedDailyHistory(ALL_PLAYERS, slots));
  }

  function cleanupSpinTimers() {
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    if (delayedSpinTimeout.current) window.clearTimeout(delayedSpinTimeout.current);
    spinTimer.current = null;
    spinTimeout.current = null;
    delayedSpinTimeout.current = null;
  }

  function persistState(nextTeam: Record<string, string | null>, finishedOverride?: boolean) {
    const finished = finishedOverride ?? slots.every((slot) => Boolean(nextTeam[slot.id]));
    saveDailyState({
      dateKey: todayKey,
      mode: dailyMode,
      team: nextTeam,
      finished,
      score: sumModeStat(nextTeam, getPlayerById, dailyMode),
    });
  }

  function spinToNextClub(nextIndex: number) {
    if (nextIndex >= dailyClubOrder.length) {
      setLocked(true);
      persistState(team, true);
      return;
    }

    const validSpinClubs = dailyClubOrder;
    if (validSpinClubs.length === 0) return;

    cleanupSpinTimers();
    spinRunId.current += 1;
    const runId = spinRunId.current;

    setSpinning(true);
    setActive(null);
    setSearch("");

    let i = 0;
    spinTimer.current = window.setInterval(() => {
      if (spinRunId.current !== runId) return;
      i = (i + 1) % validSpinClubs.length;
      setDisplayClub(validSpinClubs[i]);
    }, 60);

    spinTimeout.current = window.setTimeout(() => {
      if (spinRunId.current !== runId) return;

      cleanupSpinTimers();
      const finalClub = validSpinClubs[nextIndex];

      setDraftIndex(nextIndex);
      setClub(finalClub);
      setDisplayClub(finalClub);
      setSpinning(false);
    }, 1000);
  }

  useEffect(() => {
    const saved = loadDailyState(todayKey);

    if (saved && saved.mode === dailyMode) {
      const safeTeam = { ...createEmptyTeam(slots), ...saved.team };
      const picksMade = Object.values(safeTeam).filter(Boolean).length;
      const nextIndex = Math.min(picksMade, Math.max(dailyClubOrder.length - 1, 0));

      setTeam(safeTeam);
      setDraftIndex(nextIndex);
      setClub(dailyClubOrder[nextIndex] ?? dailyClubOrder[0] ?? AFL_CLUBS[0]);
      setDisplayClub(dailyClubOrder[nextIndex] ?? dailyClubOrder[0] ?? AFL_CLUBS[0]);
      setLocked(Boolean(saved.finished));
    } else {
      setTeam(createEmptyTeam(slots));
      setDraftIndex(0);
      setClub(dailyClubOrder[0] ?? AFL_CLUBS[0]);
      setDisplayClub(dailyClubOrder[0] ?? AFL_CLUBS[0]);
      setLocked(false);
      saveDailyState({
        dateKey: todayKey,
        mode: dailyMode,
        team: createEmptyTeam(slots),
        finished: false,
        score: 0,
      });
    }

    setHydrated(true);

    return () => {
      cleanupSpinTimers();
      spinRunId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, dailyMode, dailyClubOrder.length]);

  useEffect(() => {
    if (!hydrated) return;
    if (locked) return;
    persistState(team);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, hydrated, locked]);

  useEffect(() => {
    if (!hydrated) return;
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, team, locked]);

  useEffect(() => {
    if (!active) return;
    if (spinning) return;
    if (gameOver) return;

    const noEligibleForOpenedSlot = eligiblePlayers.length === 0;
    const noOtherValidSlotsForClub = !clubHasAnyValidPick;

    if (noEligibleForOpenedSlot && noOtherValidSlotsForClub) {
      setActive(null);
      setSearch("");

      delayedSpinTimeout.current = window.setTimeout(() => {
        spinToNextClub(draftIndex + 1);
      }, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, spinning, gameOver, eligiblePlayers.length, clubHasAnyValidPick]);

  useEffect(() => {
    if (!hydrated) return;
    const allFilled = slots.every((slot) => Boolean(team[slot.id]));
    if (!allFilled) return;
    setLocked(true);
    persistState(team, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, hydrated]);

  function onOpen(slot: Slot) {
    if (!hydrated) return;
    if (gameOver) return;
    if (spinning) return;
    if (team[slot.id]) return;

    setSearch("");

    const slotHasPlayers = hasEligiblePlayersForSlot(
      ALL_PLAYERS,
      pickedIds,
      slot,
      club.name,
      dailyMode
    );

    const clubCanFillAnySlot = emptySlots.some((s) =>
      hasEligiblePlayersForSlot(ALL_PLAYERS, pickedIds, s, club.name, dailyMode)
    );

    if (!slotHasPlayers && !clubCanFillAnySlot) {
      spinToNextClub(draftIndex + 1);
      return;
    }

    setActive({
      slotId: slot.id,
      allowed: slot.allowed,
      slotLabel: slot.label,
    });
  }

  function onPick(playerId: string) {
    if (gameOver) return;
    if (!active) return;
    if (spinning) return;
    if (team[active.slotId]) return;

    const nextTeam = { ...team, [active.slotId]: playerId };
    setTeam(nextTeam);
    setActive(null);
    setSearch("");

    const nextFilled = slots.every((slot) => Boolean(nextTeam[slot.id]));
    if (nextFilled) {
      setLocked(true);
      persistState(nextTeam, true);
      return;
    }

    delayedSpinTimeout.current = window.setTimeout(() => {
      spinToNextClub(draftIndex + 1);
    }, 650);
  }

  const modeMeta = getModeMeta(dailyMode);
  const pickNumber = Math.min(Object.values(team).filter(Boolean).length + 1, slots.length);

  if (!hydrated) {
    return (
  <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
    <div className="pointer-events-none absolute inset-0 bg-black/35" />

    {/* LEFT SIDE AD */}
    <div className="hidden xl:block fixed left-2 top-1/2 -translate-y-1/2 z-40">
      <SideBanner160 />
    </div>

    {/* RIGHT SIDE AD */}
    <div className="hidden xl:block fixed right-2 top-1/2 -translate-y-1/2 z-40">
      <SideBanner160 />
    </div>
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10">
          <div className="text-lg font-bold text-white/70">Loading daily game...</div>
        </div>
      </main>
    );
  }

  return (
  <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
    <div className="pointer-events-none absolute inset-0 bg-black/35" />

    {/* LEFT SIDE AD */}
    <div className="hidden xl:block fixed left-2 top-1/2 -translate-y-1/2 z-40">
      <SideBanner160 />
    </div>

    {/* RIGHT SIDE AD */}
    <div className="hidden xl:block fixed right-2 top-1/2 -translate-y-1/2 z-40">
      <SideBanner160 />
    </div>
      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-[0.08em] text-white sm:text-4xl">
            DAILY GAME ({todayLabel})
          </h1>

          <div className="mt-3 text-sm font-extrabold text-white sm:text-base">
            YOUR SCORE: {formatStatValue(currentScore, dailyMode)} {modeMeta.short}
            <span className={`ml-2 ${currentTier.textClass}`}>
              | {percent.toFixed(1)}% ({currentTier.label.toUpperCase()})
            </span>
          </div>
        </div>

        <div className="mt-7 sm:mt-8">
          <div className="space-y-2.5 sm:space-y-3">
            {slots.map((slot) => {
              const displayedPlayer = getPlayerById(displayedTeam[slot.id]);
              const userPlayer = getPlayerById(team[slot.id]);
              const bestPlayer = getPlayerById(bestTeam[slot.id]);

              const filled = Boolean(userPlayer);
              const clickable = !gameOver && !spinning && !filled;
              const clubMeta = displayedPlayer ? getClubMeta(displayedPlayer.club) : null;
              const isCorrect = Boolean(
                userPlayer?.id && bestPlayer?.id && userPlayer.id === bestPlayer.id
              );

              return (
                <div key={slot.id} className="flex items-stretch gap-2 sm:gap-3">
                  <div className="flex w-[58px] shrink-0 items-center justify-center rounded-lg bg-yellow-500 px-1 py-3 text-center text-[11px] font-extrabold text-black shadow-[0_8px_22px_rgba(0,0,0,0.25)] sm:w-20 sm:text-sm">
                    {slot.label}
                  </div>

                  <button
                    className={`flex min-h-[62px] flex-1 items-center justify-between gap-2 overflow-hidden rounded-none border px-3 text-left transition sm:min-h-[58px] sm:px-4 ${
                      clickable
                        ? "border-white bg-black/30 hover:brightness-110"
                        : "cursor-not-allowed border-white bg-black/25"
                    }`}
                    style={
                      displayedPlayer && clubMeta
                        ? {
                            backgroundColor: clubMeta.primary,
                            color: clubMeta.text,
                            borderColor: "#FFFFFF",
                          }
                        : undefined
                    }
                    onClick={() => onOpen(slot)}
                    disabled={!clickable}
                  >
                    <div className="min-w-0 flex flex-1 items-center gap-3">
                      {displayedPlayer && clubMeta ? (
                        <div className="relative h-8 w-8 shrink-0 sm:h-10 sm:w-10">
                          <Image
                            src={clubMeta.logo}
                            alt={clubMeta.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div
                          className={`block min-w-0 truncate text-sm leading-tight sm:text-base ${
                            displayedPlayer
                              ? "font-extrabold uppercase"
                              : "font-extrabold text-white/80"
                          }`}
                        >
                          {displayedPlayer ? displayedPlayer.name : `+ Select ${slot.label}`}
                        </div>

                        {displayedPlayer && gameOver ? (
                          <div className="mt-0.5 text-[11px] font-semibold opacity-80 sm:text-xs">
                            {showBestTeam ? "BEST PICK" : "YOUR PICK"}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {displayedPlayer ? (
                      <div className="ml-2 shrink-0 text-right">
                        <div className="whitespace-nowrap text-[10px] font-extrabold sm:text-sm">
                          {formatStatValue(displayedPlayer.stats[dailyMode], dailyMode)} {modeMeta.short}
                        </div>
                      </div>
                    ) : null}
                  </button>

                  {gameOver && !showBestTeam ? (
                    <div
                      className={`flex w-8 shrink-0 items-center justify-center text-3xl font-bold leading-none ${
                        isCorrect ? "text-[#63ff73]" : "text-[#ff5b1f]"
                      }`}
                    >
                      {isCorrect ? "✓" : "×"}
                    </div>
                  ) : gameOver && showBestTeam ? (
                    <div className="flex w-8 shrink-0 items-center justify-center text-3xl font-bold leading-none text-[#63ff73]">
                      ✓
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {!gameOver && (
          <div className="mt-8 text-center sm:mt-12">
            <div className="text-[11px] font-semibold tracking-[0.24em] text-white/55 sm:text-sm sm:tracking-[0.28em]">
              PICK {pickNumber} OF {slots.length}
            </div>

            <div className="mt-4 flex items-center justify-center sm:mt-5">
              <div
                className={`inline-flex w-full max-w-[360px] items-center justify-center gap-3 rounded-[20px] border border-white/10 px-4 py-4 text-sm font-extrabold shadow-[0_16px_50px_rgba(0,0,0,0.38)] sm:gap-4 sm:rounded-[22px] sm:px-6 sm:text-xl ${
                  spinning ? "scale-[1.01] opacity-90" : ""
                }`}
                style={{ backgroundColor: displayClub.primary, color: displayClub.text }}
              >
                <div className="relative h-9 w-9 shrink-0 sm:h-12 sm:w-12">
                  <Image
                    src={displayClub.logo}
                    alt={displayClub.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="min-w-0 truncate">{displayClub.name.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            {slots.map((slot) => {
              const p = getPlayerById(displayedTeam[slot.id]);
              if (!p) return null;
              const meta = getClubMeta(p.club);
              if (!meta) return null;

              return (
                <div
                  key={`finish-${slot.id}-${p.id}`}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 shadow-lg"
                  style={{ backgroundColor: meta.primary }}
                >
                  <div className="relative h-8 w-8">
                    <Image
                      src={meta.logo}
                      alt={meta.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {gameOver && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => setShowBestTeam((prev) => !prev)}
              className="rounded-xl bg-gradient-to-b from-[#a855f7] to-[#7c3aed] px-8 py-4 text-xl font-extrabold uppercase text-white shadow-[0_12px_30px_rgba(124,58,237,0.45)] transition hover:brightness-110"
            >
              {showBestTeam ? "View Your Team" : "View Best Team"}
            </button>

            <button
              onClick={() => {
                refreshHistory();
                setShowStats(true);
              }}
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-3 text-lg font-extrabold uppercase text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15"
            >
              Stats
            </button>
          </div>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActive(null)} />

          <div className="relative flex h-[88dvh] min-h-0 w-full flex-col rounded-t-[24px] border border-white/15 bg-zinc-950/95 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-[24px] sm:p-4">
            <div className="flex items-start justify-between gap-3 sm:items-center">
              <div className="pr-2 text-base font-extrabold tracking-wide sm:text-lg">
                Select {active.slotLabel}
              </div>

              <button
                className="min-h-[44px] min-w-[44px] rounded-2xl border border-white/20 px-3 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
                onClick={() => setActive(null)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3 shrink-0">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${active.slotLabel}...`}
                className="h-[52px] w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div
                className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]
                [&::-webkit-scrollbar]:w-3
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-white/5
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-white/20
                hover:[&::-webkit-scrollbar-thumb]:bg-white/35"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255,255,255,0.28) rgba(255,255,255,0.06)",
                }}
              >
                {eligiblePlayers.length === 0 ? (
                  <div className="p-4 text-white/60">No eligible players found.</div>
                ) : (
                  eligiblePlayers.map((p) => {
                    const clubMeta = getClubMeta(p.club);

                    return (
                      <button
                        key={p.id}
                        onClick={() => onPick(p.id)}
                        className="w-full border-b border-white/5 px-4 py-3 text-left transition hover:brightness-110 last:border-b-0"
                        style={
                          clubMeta
                            ? {
                                backgroundColor: clubMeta.primary,
                                color: clubMeta.text,
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-start gap-3">
                          {clubMeta ? (
                            <div className="relative mt-0.5 h-8 w-8 shrink-0">
                              <Image
                                src={clubMeta.logo}
                                alt={clubMeta.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-extrabold sm:text-base">
                              {p.name}
                            </div>
                            <div
                              className="mt-1 text-[11px] font-semibold leading-relaxed sm:text-xs"
                              style={{ color: clubMeta ? "rgba(255,255,255,0.78)" : undefined }}
                            >
                              {p.club} • {p.pos.join("/")}
                              {dailyMode !== "number" ? ` • #${Math.round(p.stats.number)}` : ""}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showStats && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75" onClick={() => setShowStats(false)} />

          <div className="relative flex h-[88dvh] w-full flex-col overflow-hidden border-[4px] border-[#21163f] bg-[#0b0816] shadow-[0_30px_90px_rgba(0,0,0,0.75)] sm:h-auto sm:max-h-[88vh] sm:max-w-3xl">
            <div className="border-b-[4px] border-[#21163f] bg-[#171129] px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-3xl font-black leading-none tracking-tight text-white drop-shadow-[3px_3px_0_rgba(90,70,140,0.25)] sm:text-5xl">
                    Daily Score Stats
                  </div>
                  <div className="mt-3 text-sm font-bold text-white/70 sm:text-lg">
                    Your daily game percentages
                  </div>
                </div>

                <button
                  className="shrink-0 text-4xl font-black leading-none text-white/50 transition hover:scale-110 hover:text-white"
                  onClick={() => setShowStats(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0b0816] px-3 py-3 sm:px-5 sm:py-4">
              {historyEntries.length === 0 ? (
                <div className="border-[4px] border-[#21163f] bg-[#151022] px-5 py-6 text-base font-bold text-white/75">
                  No saved daily games yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyEntries.map((entry) => {
                    const tier = getPercentTier(entry.percent);

                    return (
                      <div
                        key={entry.dateKey}
                        className="flex items-center justify-between gap-3 border-[4px] border-[#21163f] bg-[#151022] px-4 py-4 shadow-[0_2px_0_rgba(0,0,0,0.2)] sm:px-5"
                      >
                        <div className="min-w-0">
                          <div className="text-xl font-black leading-none text-white sm:text-2xl">
                            {formatHistoryDate(entry.dateKey)}
                          </div>
                          <div className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-white/45">
                            Daily score
                          </div>
                          <div className="mt-1 text-sm font-bold text-white/80 sm:text-base">
                            {entry.score.toFixed(1)} / {entry.bestScore.toFixed(1)}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`inline-flex min-w-[110px] items-center justify-center border-[3px] px-4 py-3 text-xl font-black sm:min-w-[130px] sm:text-2xl ${tier.pillClass}`}
                          >
                            {entry.percent.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}