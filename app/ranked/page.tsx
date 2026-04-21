"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import players2026 from "@/app/data/afl_players26.json";

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

type RankedTopEntry = {
  name: string;
  score: number;
  rank?: number;
};

type RankedPreview = {
  topScore: number;
  topName: string;
  estimatedRank: number | null;
  totalEntries: number;
};

/** ================= Slots ================= */
const DEFAULT_SLOTS: Slot[] = [
  { id: "fwd1", label: "FWD", allowed: ["FWD"] },
  { id: "fwd2", label: "FWD", allowed: ["FWD"] },
  { id: "mid1", label: "MID", allowed: ["MID"] },
  { id: "mid2", label: "MID", allowed: ["MID"] },
  { id: "def1", label: "DEF", allowed: ["DEF"] },
  { id: "def2", label: "DEF", allowed: ["DEF"] },
  { id: "ruck", label: "RUCK", allowed: ["RUCK"] },
  { id: "flex1", label: "FLEX", allowed: ["FWD", "MID", "DEF"] },
];

const HITOUT_SLOTS: Slot[] = [
  { id: "ruck1", label: "RUCK", allowed: ["RUCK"] },
  { id: "ruck2", label: "RUCK", allowed: ["RUCK"] },
  { id: "ruck3", label: "RUCK", allowed: ["RUCK"] },
  { id: "ruck4", label: "RUCK", allowed: ["RUCK"] },
  { id: "ruck5", label: "RUCK", allowed: ["RUCK"] },
  { id: "ruck6", label: "RUCK", allowed: ["RUCK"] },
];

/** ================= Modes ================= */
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
  { key: "sc_points", label: "SC Points", short: "SC" },
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

function getSlotsForMode(mode: StatMode): Slot[] {
  if (mode === "hitouts") return HITOUT_SLOTS;
  return DEFAULT_SLOTS;
}

function createEmptyTeam(slots: Slot[]): Record<string, string | null> {
  return Object.fromEntries(slots.map((slot) => [slot.id, null])) as Record<string, string | null>;
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

function getRankedNameKey() {
  return "ranked_player_name_2026";
}

/** ================= Animated Dropdown ================= */
function ModeDropdown({
  mode,
  setMode,
  disabled,
}: {
  mode: StatMode;
  setMode: (mode: StatMode) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const current = getModeMeta(mode);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [mode]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left backdrop-blur-xl transition ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
            : "border-white/15 bg-white/8 text-white hover:border-white/30 hover:bg-white/12"
        }`}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-white/45">
            MODE
          </div>
          <div className="mt-1 truncate text-base font-extrabold sm:text-lg">
            {current.label}
          </div>
        </div>

        <div
          className={`ml-4 shrink-0 text-xl transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          ▾
        </div>
      </button>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-2xl border border-white/12 bg-[#082036]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-300 ${
          open
            ? "pointer-events-auto max-h-[420px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        }`}
      >
        <div className="max-h-[420px] overflow-y-auto p-2">
          {MODE_OPTIONS.map((option) => {
            const active = option.key === mode;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setMode(option.key)}
                className={`flex min-h-[50px] w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="font-bold">{option.label}</span>
                <span
                  className={`ml-3 text-xs font-extrabold tracking-[0.18em] ${
                    active ? "text-black/70" : "text-white/45"
                  }`}
                >
                  {option.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** ================= Page ================= */
export default function RankedPage() {
  const ALL_PLAYERS = useMemo(() => normalize2026Players(players2026), []);

  const [mode, setMode] = useState<StatMode>("sc_points");

  const slots = useMemo(() => getSlotsForMode(mode), [mode]);

  const SPIN_CLUBS = useMemo(() => {
    const clubs = clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS);
    return clubs.length > 0 ? clubs : AFL_CLUBS;
  }, [ALL_PLAYERS]);

  const [club, setClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);

  const [team, setTeam] = useState<Record<string, string | null>>({});
  const [active, setActive] = useState<ActivePicker | null>(null);
  const [search, setSearch] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const [rankedPreview, setRankedPreview] = useState<RankedPreview>({
    topScore: 0,
    topName: "—",
    estimatedRank: null,
    totalEntries: 0,
  });

  const [topEntries, setTopEntries] = useState<RankedTopEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const spinTimer = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);
  const delayedSpinTimeout = useRef<number | null>(null);
  const mountSpinTimeout = useRef<number | null>(null);
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

  const currentScore = useMemo(() => {
    return sumModeStat(team, getPlayerById, mode);
  }, [team, mode, ALL_PLAYERS]);

  const emptySlots = useMemo(() => slots.filter((slot) => !team[slot.id]), [team, slots]);
  const allFilled = useMemo(() => slots.every((slot) => Boolean(team[slot.id])), [team, slots]);
  const gameOver = allFilled;

  const clubPlayers = useMemo(() => {
    return ALL_PLAYERS
      .filter((p) => p.club === club.name)
      .filter((p) => p.stats[mode] > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ALL_PLAYERS, club.name, mode]);

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
      hasEligiblePlayersForSlot(ALL_PLAYERS, pickedIds, slot, club.name, mode)
    );
  }, [emptySlots, club.name, pickedIds, ALL_PLAYERS, mode]);

  const modeMeta = getModeMeta(mode);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("ranked_selected_mode_2026");
      if (savedMode && MODE_OPTIONS.some((option) => option.key === savedMode)) {
        setMode(savedMode as StatMode);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ranked_selected_mode_2026", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    try {
      const savedName = localStorage.getItem(getRankedNameKey()) ?? "";
      setPlayerName(savedName);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(getRankedNameKey(), playerName);
    } catch {}
  }, [playerName]);

  function cleanupSpinTimers() {
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    if (delayedSpinTimeout.current) window.clearTimeout(delayedSpinTimeout.current);
    if (mountSpinTimeout.current) window.clearTimeout(mountSpinTimeout.current);
    spinTimer.current = null;
    spinTimeout.current = null;
    delayedSpinTimeout.current = null;
    mountSpinTimeout.current = null;
  }

  function hardResetGame(nextMode?: StatMode) {
    cleanupSpinTimers();
    spinRunId.current += 1;
    setSpinning(false);
    setActive(null);
    setSearch("");
    setSubmitState("idle");
    setSubmitMessage("");

    const useMode = nextMode ?? mode;
    const nextSlots = getSlotsForMode(useMode);
    setTeam(createEmptyTeam(nextSlots));

    const clubsWithMode = clampClubsToPlayers(
      AFL_CLUBS,
      ALL_PLAYERS.filter((p) => p.stats[useMode] > 0)
    );

    const availableClubs =
      clubsWithMode.length > 0 ? clubsWithMode : SPIN_CLUBS.length > 0 ? SPIN_CLUBS : AFL_CLUBS;

    const randomStartClub =
      availableClubs[Math.floor(Math.random() * availableClubs.length)];

    setClub(randomStartClub);
    setDisplayClub(randomStartClub);
  }

  function spinToRandomClub(currentMode?: StatMode) {
    const useMode = currentMode ?? mode;
    if (gameOver) return;

    const validSpinClubs = clampClubsToPlayers(
      AFL_CLUBS,
      ALL_PLAYERS.filter((p) => p.stats[useMode] > 0)
    );

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

      const previousClubName = club.name;
      let final = validSpinClubs[0];

      const available = validSpinClubs.filter((c) => c.name !== previousClubName);
      if (available.length > 0) {
        final = available[Math.floor(Math.random() * available.length)];
      }

      if (spinRunId.current !== runId) return;
      setClub(final);
      setDisplayClub(final);
      setSpinning(false);
    }, 1200);
  }

  async function refreshRankedData(useMode: StatMode, scoreForPreview?: number) {
    setLoadingPreview(true);

    try {
      const res = await fetch(
        `/api/ranked/top?mode=${encodeURIComponent(useMode)}${
          typeof scoreForPreview === "number" ? `&score=${encodeURIComponent(String(scoreForPreview))}` : ""
        }`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Failed to load ranked data");

      const data = await res.json();

      const entries: RankedTopEntry[] = Array.isArray(data?.entries) ? data.entries : [];

      setTopEntries(entries.slice(0, 5));

      setRankedPreview({
        topScore: Number(data?.topScore ?? entries[0]?.score ?? 0) || 0,
        topName:
          typeof data?.topName === "string"
            ? data.topName
            : typeof entries[0]?.name === "string"
            ? entries[0].name
            : "—",
        estimatedRank:
          data?.estimatedRank == null ? null : Number(data.estimatedRank),
        totalEntries: Number(data?.totalEntries ?? entries.length ?? 0) || 0,
      });
    } catch {
      setTopEntries([]);
      setRankedPreview({
        topScore: 0,
        topName: "—",
        estimatedRank: null,
        totalEntries: 0,
      });
    } finally {
      setLoadingPreview(false);
    }
  }

  useEffect(() => {
    hardResetGame(mode);

    mountSpinTimeout.current = window.setTimeout(() => {
      spinToRandomClub(mode);
    }, 50);

    refreshRankedData(mode);

    return () => {
      cleanupSpinTimers();
      spinRunId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ALL_PLAYERS.length]);

  useEffect(() => {
    if (!gameOver) return;
    cleanupSpinTimers();
    spinRunId.current += 1;
    setSpinning(false);
    setActive(null);
    setSearch("");
    refreshRankedData(mode, currentScore);
  }, [gameOver, mode, currentScore]);

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
        spinToRandomClub();
      }, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, spinning, gameOver, eligiblePlayers.length, clubHasAnyValidPick]);

  function onOpen(slot: Slot) {
    if (gameOver) return;
    if (spinning) return;
    if (team[slot.id]) return;

    setSearch("");

    const slotHasPlayers = hasEligiblePlayersForSlot(ALL_PLAYERS, pickedIds, slot, club.name, mode);
    const clubCanFillAnySlot = emptySlots.some((s) =>
      hasEligiblePlayersForSlot(ALL_PLAYERS, pickedIds, s, club.name, mode)
    );

    if (!slotHasPlayers && !clubCanFillAnySlot) {
      spinToRandomClub();
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

    setTeam((prev) => ({ ...prev, [active.slotId]: playerId }));
    setActive(null);
    setSearch("");

    delayedSpinTimeout.current = window.setTimeout(() => {
      spinToRandomClub();
    }, 650);
  }

  function resetGame() {
    hardResetGame(mode);
    mountSpinTimeout.current = window.setTimeout(() => {
      spinToRandomClub(mode);
    }, 50);
    refreshRankedData(mode);
  }

  async function submitRankedScore() {
    if (!gameOver) return;

    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setSubmitState("error");
      setSubmitMessage("Enter a name before submitting.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("");

    try {
      const res = await fetch("/api/ranked/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          mode,
          score: currentScore,
          team,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit score.");
      }

      const data = await res.json();

      setSubmitState("submitted");
      setSubmitMessage(
        data?.rank
          ? `Score submitted. You are now ranked #${data.rank}.`
          : "Score submitted successfully."
      );

      await refreshRankedData(mode, currentScore);
    } catch {
      setSubmitState("error");
      setSubmitMessage("Could not submit score right now.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0 bg-black/35" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-[0.08em] text-white sm:text-4xl">
            RANKED MODE
          </h1>
          <div className="mt-2 text-sm font-semibold text-white/70 sm:text-base">
            Global ranked run with live leaderboard placement
          </div>
        </div>

        <div className="mt-5 flex justify-center sm:mt-6">
          <ModeDropdown mode={mode} setMode={setMode} disabled={spinning} />
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-6 sm:py-6">
            <div className="text-[10px] font-extrabold tracking-[0.24em] text-white/45 sm:text-[11px] sm:tracking-[0.28em]">
              CURRENT SCORE
            </div>

            <div className="mt-3 flex items-end gap-2 flex-wrap sm:mt-4">
              <span className="break-all text-4xl font-extrabold leading-none text-white sm:text-5xl">
                {formatStatValue(currentScore, mode)}
              </span>
              <span className="pb-1.5 text-xs font-bold tracking-[0.14em] text-white/40 sm:pb-2 sm:text-sm sm:tracking-[0.16em]">
                {modeMeta.short}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-6 sm:py-6">
            <div className="text-[10px] font-extrabold tracking-[0.24em] text-white/45 sm:text-[11px] sm:tracking-[0.28em]">
              GLOBAL BEST
            </div>

            <div className="mt-3 flex items-end gap-2 flex-wrap sm:mt-4">
              <span className="break-all bg-gradient-to-b from-[#fff7c2] via-[#f2cf63] to-[#c78a18] bg-clip-text text-4xl font-extrabold leading-none text-transparent sm:text-5xl">
                {loadingPreview ? "..." : formatStatValue(rankedPreview.topScore, mode)}
              </span>
              <span className="pb-1.5 text-xs font-bold tracking-[0.14em] text-[#d7bb67] sm:pb-2 sm:text-sm sm:tracking-[0.16em]">
                {modeMeta.short}
              </span>
            </div>

            <div className="mt-2 truncate text-sm font-semibold text-white/65">
              {loadingPreview ? "Loading..." : `Held by ${rankedPreview.topName}`}
            </div>

            <div className="mt-3 flex items-end gap-2 flex-wrap sm:mt-4">
              <span className="break-all text-4xl font-extrabold leading-none text-white sm:text-5xl">
                {loadingPreview
                  ? "..."
                  : rankedPreview.estimatedRank
                  ? `#${rankedPreview.estimatedRank}`
                  : "—"}
              </span>
            </div>

            <div className="mt-2 text-sm font-semibold text-white/65">
              {loadingPreview
                ? "Loading..."
                : rankedPreview.totalEntries > 0
                ? `Based on ${rankedPreview.totalEntries} entries`
                : "No ranked data yet"}
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="mt-6 px-1 text-center sm:px-2">
            <div className="text-xl font-extrabold tracking-[0.12em] text-white sm:text-3xl sm:tracking-[0.14em]">
              RUN COMPLETE
            </div>
            <div className="mt-2 text-sm font-bold text-white/70 sm:text-base">
              Final Score: {formatStatValue(currentScore, mode)} {modeMeta.short}
            </div>

            <div className="mx-auto mt-5 w-full max-w-xl rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-5">
              <div className="text-left text-[11px] font-extrabold tracking-[0.22em] text-white/45">
                SUBMIT TO GLOBAL LEADERBOARD
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                  placeholder="Enter your name"
                  className="h-[50px] flex-1 rounded-2xl border border-white/15 bg-black/40 px-4 text-base text-white outline-none focus:border-white/40"
                />

                <button
                  onClick={submitRankedScore}
                  disabled={submitState === "submitting" || submitState === "submitted"}
                  className={`min-h-[50px] rounded-2xl px-5 font-extrabold transition ${
                    submitState === "submitted"
                      ? "cursor-not-allowed border border-green-400/25 bg-green-500/20 text-green-200"
                      : "border border-white/15 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/14"
                  }`}
                >
                  {submitState === "submitting"
                    ? "Submitting..."
                    : submitState === "submitted"
                    ? "Submitted"
                    : "Submit Score"}
                </button>
              </div>

              {submitMessage ? (
                <div
                  className={`mt-3 text-sm font-semibold ${
                    submitState === "error" ? "text-red-300" : "text-white/75"
                  }`}
                >
                  {submitMessage}
                </div>
              ) : null}

              <div className="mt-4 flex justify-center">
                <button
                  className="min-h-[48px] w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-white/90 backdrop-blur-md transition hover:border-white/30 hover:bg-white/14 sm:w-auto"
                  onClick={resetGame}
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 sm:mt-8">
          <div className="space-y-2.5 sm:space-y-3">
            {slots.map((slot) => {
              const p = getPlayerById(team[slot.id]);
              const filled = Boolean(p);
              const clickable = !gameOver && !spinning && !filled;
              const clubMeta = p ? getClubMeta(p.club) : null;

              return (
                <div key={slot.id} className="flex items-stretch gap-2 sm:gap-3">
                  <div className="flex w-[58px] shrink-0 items-center justify-center rounded-lg bg-yellow-500 px-1 py-3 text-center text-[11px] font-extrabold text-black shadow-[0_8px_22px_rgba(0,0,0,0.25)] sm:w-20 sm:text-sm">
                    {slot.label}
                  </div>

                  <button
                    className={`flex min-h-[62px] flex-1 items-center justify-between gap-2 overflow-hidden rounded-xl border px-3 text-left transition sm:min-h-[58px] sm:px-4 ${
                      clickable
                        ? "border-white/60 bg-black/30 hover:brightness-110"
                        : "cursor-not-allowed border-white/20 bg-black/25"
                    }`}
                    style={
                      p && clubMeta
                        ? {
                            backgroundColor: clubMeta.primary,
                            color: clubMeta.text,
                            borderColor: "rgba(255,255,255,0.28)",
                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                          }
                        : undefined
                    }
                    onClick={() => onOpen(slot)}
                    disabled={!clickable}
                  >
                    <div className="min-w-0 flex flex-1 items-center gap-3">
                      {p && clubMeta ? (
                        <div className="relative h-8 w-8 shrink-0 sm:h-10 sm:w-10">
                          <Image
                            src={clubMeta.logo}
                            alt={clubMeta.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : null}

                      <span
                        className={`block min-w-0 truncate text-sm sm:text-base ${
                          p ? "font-extrabold" : "font-extrabold text-white/80"
                        }`}
                      >
                        {p ? p.name : `+ Select ${slot.label}`}
                      </span>
                    </div>

                    {p ? (
                      <span
                        className="ml-2 shrink-0 whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] font-extrabold sm:px-2.5 sm:text-sm"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.28)",
                          borderColor: "rgba(255,255,255,0.18)",
                          color: clubMeta?.text ?? "#fff",
                        }}
                      >
                        {formatStatValue(p.stats[mode], mode)} {mode === "age" ? "Years" : modeMeta.short}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center sm:mt-12">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-white/55 sm:text-sm sm:tracking-[0.28em]">
            DRAFTING FROM
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

        <div className="mt-8 rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.22em] text-white/45">
                LIVE TOP SCORES
              </div>
              <div className="mt-1 text-sm font-semibold text-white/65">
                Current best players in {modeMeta.label}
              </div>
            </div>

            <button
              onClick={() => refreshRankedData(mode, gameOver ? currentScore : undefined)}
              className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-bold text-white/85 transition hover:border-white/30 hover:bg-white/12 hover:text-white sm:text-xs"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {topEntries.length === 0 ? (
              <div className="sm:col-span-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/60">
                No global scores yet.
              </div>
            ) : (
              topEntries.map((entry, index) => (
                <div
                  key={`${entry.name}-${entry.score}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                >
                  <div className="text-xs font-extrabold tracking-[0.18em] text-white/45">
                    #{entry.rank ?? index + 1}
                  </div>
                  <div className="mt-2 truncate text-base font-extrabold text-white">
                    {entry.name}
                  </div>
                  <div className="mt-2 bg-gradient-to-b from-[#fff7c2] via-[#f2cf63] to-[#c78a18] bg-clip-text text-2xl font-extrabold text-transparent">
                    {formatStatValue(entry.score, mode)}
                  </div>
                  <div className="text-xs font-bold tracking-[0.14em] text-[#d7bb67]">
                    {modeMeta.short}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
                              {mode !== "number" ? ` • #${Math.round(p.stats.number)}` : ""}
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
    </main>
  );
}