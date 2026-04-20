"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import players2026 from "@/app/data/afl_players26.json";

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
  side: "A" | "B";
};

type ModeOption = {
  key: StatMode;
  label: string;
  short: string;
};

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

const BOUNCES_SLOTS: Slot[] = [
  { id: "fwd1", label: "FWD", allowed: ["FWD"] },
  { id: "fwd2", label: "FWD", allowed: ["FWD"] },
  { id: "mid1", label: "MID", allowed: ["MID"] },
  { id: "mid2", label: "MID", allowed: ["MID"] },
  { id: "def1", label: "DEF", allowed: ["DEF"] },
  { id: "def2", label: "DEF", allowed: ["DEF"] },
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

const BUTTON_ANIM =
  "transition-transform duration-100 ease-out hover:scale-[1.01] active:scale-[0.985]";

const TEAM_A_ACCENT_BG = "#67E8F9";
const TEAM_A_ACCENT_TEXT = "#001018";
const TEAM_B_ACCENT_BG = "#F9A8D4";
const TEAM_B_ACCENT_TEXT = "#2A1020";

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
    const valid = value.filter(
      (v): v is PlayerPos => v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
    );
    return valid.length ? valid : ["MID"];
  }

  if (typeof value === "string") {
    const mapped = value
      .split(/[\/,| ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean)
      .map((p) => (p === "RUC" ? "RUCK" : p))
      .filter((v): v is PlayerPos => v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK");

    return mapped.length ? mapped : ["MID"];
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
  if (mode === "bounces") return BOUNCES_SLOTS;
  return DEFAULT_SLOTS;
}

function createEmptyTeam(slots: Slot[]): Record<string, string | null> {
  return Object.fromEntries(slots.map((slot) => [slot.id, null])) as Record<string, string | null>;
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

function getTurnFromPickNumber(pickNumber: number): "A" | "B" {
  const pattern: ("A" | "B")[] = ["A", "B", "B", "A"];
  return pattern[pickNumber % pattern.length];
}

function sumModeStatFast(
  team: Record<string, string | null>,
  playerMap: Map<string, Player>,
  mode: StatMode
) {
  let total = 0;
  for (const id of Object.values(team)) {
    if (!id) continue;
    const p = playerMap.get(id);
    if (p) total += p.stats[mode] ?? 0;
  }
  return total;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

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
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
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
        className={`${BUTTON_ANIM} flex min-h-[52px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
          disabled
            ? "cursor-not-allowed border-white/10 bg-zinc-900 text-white/40"
            : "border-white/15 bg-zinc-900 text-white hover:border-white/30"
        }`}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-white/45">MODE</div>
          <div className="mt-1 truncate text-base sm:text-lg font-extrabold">{current.label}</div>
        </div>
        <div className="ml-4 shrink-0 text-xl">▾</div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-xl border border-white/12 bg-zinc-950 shadow-xl">
          <div className="max-h-[420px] overflow-y-auto p-2">
            {MODE_OPTIONS.map((option) => {
              const active = option.key === mode;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMode(option.key)}
                  className={`${BUTTON_ANIM} flex min-h-[50px] w-full items-center justify-between rounded-lg px-3 py-3 text-left ${
                    active ? "bg-white text-black" : "text-white hover:bg-white/8"
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
      )}
    </div>
  );
}

export default function LocalPage() {
  const allPlayers = useMemo(() => normalize2026Players(players2026), []);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of allPlayers) map.set(p.id, p);
    return map;
  }, [allPlayers]);

  const clubMetaMap = useMemo(() => {
    const map = new Map<string, ClubMeta>();
    for (const c of AFL_CLUBS) map.set(c.name, c);
    return map;
  }, []);

  const [mode, setMode] = useState<StatMode>("sc_points");
  const slots = useMemo(() => getSlotsForMode(mode), [mode]);

  const playersByClubAndMode = useMemo(() => {
    const outer = new Map<StatMode, Map<string, Player[]>>();

    for (const option of MODE_OPTIONS) {
      const clubMap = new Map<string, Player[]>();

      for (const player of allPlayers) {
        if (player.stats[option.key] <= 0) continue;

        if (option.key === "bounces" && player.pos.includes("RUCK")) continue;

        const arr = clubMap.get(player.club);
        if (arr) arr.push(player);
        else clubMap.set(player.club, [player]);
      }

      for (const arr of clubMap.values()) {
        arr.sort((a, b) => a.name.localeCompare(b.name));
      }

      outer.set(option.key, clubMap);
    }

    return outer;
  }, [allPlayers]);

  const validClubsForMode = useMemo(() => {
    const clubMap = playersByClubAndMode.get(mode);
    const validNames = new Set([...(clubMap?.keys() ?? [])]);
    const valid = AFL_CLUBS.filter((club) => validNames.has(club.name));
    return valid.length ? valid : AFL_CLUBS;
  }, [mode, playersByClubAndMode]);

  const [club, setClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);

  const [teamA, setTeamA] = useState<Record<string, string | null>>(() => createEmptyTeam(DEFAULT_SLOTS));
  const [teamB, setTeamB] = useState<Record<string, string | null>>(() => createEmptyTeam(DEFAULT_SLOTS));
  const [pickCount, setPickCount] = useState(0);

  const [teamNameA, setTeamNameA] = useState("Player A");
  const [teamNameB, setTeamNameB] = useState("Player B");
  const [editingTeam, setEditingTeam] = useState<"A" | "B" | null>(null);
  const [teamNameDraft, setTeamNameDraft] = useState("");

  const [active, setActive] = useState<ActivePicker | null>(null);
  const [search, setSearch] = useState("");

  const spinTimeoutRef = useRef<number | null>(null);
  const spinIntervalRef = useRef<number | null>(null);

  const turn = getTurnFromPickNumber(pickCount);

  const pickedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of Object.values(teamA)) if (id) ids.add(id);
    for (const id of Object.values(teamB)) if (id) ids.add(id);
    return ids;
  }, [teamA, teamB]);

  const currentTeam = turn === "A" ? teamA : teamB;

  const scoreA = useMemo(() => sumModeStatFast(teamA, playerMap, mode), [teamA, playerMap, mode]);
  const scoreB = useMemo(() => sumModeStatFast(teamB, playerMap, mode), [teamB, playerMap, mode]);

  const allFilledA = useMemo(() => slots.every((slot) => Boolean(teamA[slot.id])), [slots, teamA]);
  const allFilledB = useMemo(() => slots.every((slot) => Boolean(teamB[slot.id])), [slots, teamB]);
  const gameOver = allFilledA && allFilledB;

  const winnerText =
    scoreA > scoreB
      ? `${teamNameA.toUpperCase()} WINS`
      : scoreB > scoreA
        ? `${teamNameB.toUpperCase()} WINS`
        : "DRAW";

  const clubPlayers = useMemo(() => {
    return playersByClubAndMode.get(mode)?.get(club.name) ?? [];
  }, [playersByClubAndMode, mode, club.name]);

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];

    const q = search.trim().toLowerCase();
    const result: Player[] = [];

    for (const p of clubPlayers) {
      if (pickedIds.has(p.id)) continue;

      let allowed = false;
      for (const pos of p.pos) {
        if (active.allowed.includes(pos)) {
          allowed = true;
          break;
        }
      }
      if (!allowed) continue;
      if (q && !p.name.toLowerCase().includes(q)) continue;
      result.push(p);
    }

    return result;
  }, [active, search, clubPlayers, pickedIds]);

  const clubHasAnyValidPick = useMemo(() => {
    const openSlots = slots.filter((slot) => !currentTeam[slot.id]);
    if (openSlots.length === 0) return false;

    for (const p of clubPlayers) {
      if (pickedIds.has(p.id)) continue;

      for (const slot of openSlots) {
        let allowed = false;
        for (const pos of p.pos) {
          if (slot.allowed.includes(pos)) {
            allowed = true;
            break;
          }
        }
        if (allowed) return true;
      }
    }

    return false;
  }, [slots, currentTeam, clubPlayers, pickedIds]);

  const clearSpinTimers = useCallback(() => {
    if (spinTimeoutRef.current) {
      window.clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
    if (spinIntervalRef.current) {
      window.clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
  }, []);

  const chooseRandomClub = useCallback(
    (excludeName?: string) => {
      const filtered = validClubsForMode.filter((c) => c.name !== excludeName);
      const pool = filtered.length > 0 ? filtered : validClubsForMode;
      if (pool.length === 0) return validClubsForMode[0] ?? AFL_CLUBS[0];
      return pool[Math.floor(Math.random() * pool.length)];
    },
    [validClubsForMode]
  );

  const spinToRandomClub = useCallback(
    (excludeName?: string) => {
      if (gameOver) return;

      clearSpinTimers();
      setSpinning(true);

      const filtered = validClubsForMode.filter((c) => c.name !== excludeName);
      const pool = filtered.length > 0 ? filtered : validClubsForMode;
      const nextClub = chooseRandomClub(excludeName);

      if (pool.length <= 1) {
        setClub(nextClub);
        setDisplayClub(nextClub);
        setSpinning(false);
        return;
      }

      let i = 0;
      spinIntervalRef.current = window.setInterval(() => {
        const nextDisplay = pool[i % pool.length];
        setDisplayClub(nextDisplay);
        i += 1;
      }, 45);

      spinTimeoutRef.current = window.setTimeout(() => {
        clearSpinTimers();
        setClub(nextClub);
        setDisplayClub(nextClub);
        setSpinning(false);
      }, 700);
    },
    [chooseRandomClub, clearSpinTimers, gameOver, validClubsForMode]
  );

  const resetGame = useCallback(
    (nextMode?: StatMode) => {
      const useMode = nextMode ?? mode;
      const nextSlots = getSlotsForMode(useMode);
      const nextClubPool =
        [...(playersByClubAndMode.get(useMode)?.keys() ?? [])].length > 0
          ? AFL_CLUBS.filter((c) => playersByClubAndMode.get(useMode)?.has(c.name) ?? false)
          : AFL_CLUBS;

      const startClub =
        nextClubPool[Math.floor(Math.random() * nextClubPool.length)] ?? AFL_CLUBS[0];

      clearSpinTimers();
      setSpinning(false);
      setActive(null);
      setSearch("");
      setPickCount(0);
      setTeamA(createEmptyTeam(nextSlots));
      setTeamB(createEmptyTeam(nextSlots));
      setClub(startClub);
      setDisplayClub(startClub);
    },
    [mode, playersByClubAndMode, clearSpinTimers]
  );

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("local_selected_mode_2026");
      if (savedMode && MODE_OPTIONS.some((option) => option.key === savedMode)) {
        setMode(savedMode as StatMode);
      }

      const savedTeamNameA = localStorage.getItem("local_team_name_a");
      const savedTeamNameB = localStorage.getItem("local_team_name_b");

      if (savedTeamNameA?.trim()) setTeamNameA(savedTeamNameA.trim());
      if (savedTeamNameB?.trim()) setTeamNameB(savedTeamNameB.trim());
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("local_selected_mode_2026", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem("local_team_name_a", teamNameA);
      localStorage.setItem("local_team_name_b", teamNameB);
    } catch {}
  }, [teamNameA, teamNameB]);

  useEffect(() => {
    resetGame(mode);
    return clearSpinTimers;
  }, [mode, resetGame, clearSpinTimers]);

  useEffect(() => {
    if (!active || spinning || gameOver) return;

    if (eligiblePlayers.length === 0 && !clubHasAnyValidPick) {
      setActive(null);
      setSearch("");
      spinToRandomClub(club.name);
    }
  }, [active, spinning, gameOver, eligiblePlayers.length, clubHasAnyValidPick, spinToRandomClub, club.name]);

  useEffect(() => {
    if (gameOver) {
      setActive(null);
      setSearch("");
      setSpinning(false);
      clearSpinTimers();
    }
  }, [gameOver, clearSpinTimers]);

  const startEditingTeamName = useCallback(
    (side: "A" | "B") => {
      setEditingTeam(side);
      setTeamNameDraft(side === "A" ? teamNameA : teamNameB);
    },
    [teamNameA, teamNameB]
  );

  const saveEditingTeamName = useCallback(() => {
    if (!editingTeam) return;

    const cleaned = teamNameDraft.trim().slice(0, 13);
    if (editingTeam === "A") {
      setTeamNameA(cleaned || "Player A");
    } else {
      setTeamNameB(cleaned || "Player B");
    }
    setEditingTeam(null);
    setTeamNameDraft("");
  }, [editingTeam, teamNameDraft]);

  const cancelEditingTeamName = useCallback(() => {
    setEditingTeam(null);
    setTeamNameDraft("");
  }, []);

  const onOpen = useCallback(
    (slot: Slot, side: "A" | "B") => {
      if (gameOver || spinning || side !== turn) return;

      const selectedTeam = side === "A" ? teamA : teamB;
      if (selectedTeam[slot.id]) return;

      const remainingSlots = slots.filter((s) => !selectedTeam[s.id]);
      const availablePlayers = clubPlayers.filter((p) => !pickedIds.has(p.id));

      let slotHasPlayers = false;
      for (const p of availablePlayers) {
        for (const pos of p.pos) {
          if (slot.allowed.includes(pos)) {
            slotHasPlayers = true;
            break;
          }
        }
        if (slotHasPlayers) break;
      }

      let clubCanFillAnySlot = false;
      outer: for (const p of availablePlayers) {
        for (const s of remainingSlots) {
          for (const pos of p.pos) {
            if (s.allowed.includes(pos)) {
              clubCanFillAnySlot = true;
              break outer;
            }
          }
        }
      }

      setSearch("");

      if (!slotHasPlayers && !clubCanFillAnySlot) {
        spinToRandomClub(club.name);
        return;
      }

      setActive({
        slotId: slot.id,
        allowed: slot.allowed,
        slotLabel: slot.label,
        side,
      });
    },
    [gameOver, spinning, turn, teamA, teamB, slots, clubPlayers, pickedIds, spinToRandomClub, club.name]
  );

  const onPick = useCallback(
    (playerId: string) => {
      if (gameOver || !active || spinning) return;

      const setter = active.side === "A" ? setTeamA : setTeamB;

      setter((prev) => {
        if (prev[active.slotId]) return prev;
        return { ...prev, [active.slotId]: playerId };
      });

      const nextPickCount = pickCount + 1;

      setActive(null);
      setSearch("");
      setPickCount(nextPickCount);

      if (nextPickCount % 2 === 0 && nextPickCount < slots.length * 2) {
        spinToRandomClub(club.name);
      }
    },
    [gameOver, active, spinning, pickCount, spinToRandomClub, club.name, slots.length]
  );

  const modeMeta = getModeMeta(mode);

  function renderEditableHeaderName(
    side: "A" | "B",
    name: string,
    accentTextClass?: string
  ) {
    const isEditing = editingTeam === side;

    if (isEditing) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={teamNameDraft}
            onChange={(e) => setTeamNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditingTeamName();
              if (e.key === "Escape") cancelEditingTeamName();
            }}
            autoFocus
            maxLength={13}
            className="w-[120px] rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white outline-none focus:border-white/40 sm:w-[150px]"
          />
          <button
            type="button"
            onClick={saveEditingTeamName}
            className={`${BUTTON_ANIM} min-h-[32px] rounded-md border border-white/20 px-2 py-1 text-[10px] font-extrabold tracking-[0.18em] text-white/80 hover:bg-white/8`}
          >
            OK
          </button>
        </div>
      );
    }

    return (
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={`truncate text-[10px] sm:text-[11px] font-extrabold tracking-[0.22em] sm:tracking-[0.28em] text-white/45 ${
            accentTextClass ?? ""
          }`}
        >
          {name.toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => startEditingTeamName(side)}
          className={`${BUTTON_ANIM} shrink-0 rounded-md border border-white/10 p-1 text-white/55 hover:border-white/25 hover:bg-white/8 hover:text-white`}
          aria-label={`Edit ${name} name`}
          title={`Edit ${name} name`}
        >
          <PencilIcon />
        </button>
      </div>
    );
  }

  function renderTeamColumn(
    title: string,
    side: "A" | "B",
    team: Record<string, string | null>,
    score: number,
    accentClasses: string
  ) {
    const slotAccentBg = side === "A" ? TEAM_A_ACCENT_BG : TEAM_B_ACCENT_BG;
    const slotAccentText = side === "A" ? TEAM_A_ACCENT_TEXT : TEAM_B_ACCENT_TEXT;

    return (
      <div className="rounded-2xl border border-white/12 bg-black/90 p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`text-lg sm:text-2xl font-extrabold tracking-[0.08em] ${accentClasses}`}>
              {title}
            </div>
            <div className="mt-1 text-xs sm:text-sm font-semibold text-white/60">
              {turn === side && !gameOver ? "Your turn" : gameOver ? "Finished" : "Waiting"}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[10px] font-extrabold tracking-[0.2em] sm:tracking-[0.22em] text-white/45 sm:text-[11px]">
              SCORE
            </div>
            <div className="mt-1 text-2xl sm:text-4xl font-extrabold text-white">
              {formatStatValue(score, mode)}
            </div>
            <div className="text-[10px] sm:text-xs font-bold tracking-[0.16em] sm:tracking-[0.18em] text-white/45">
              {mode === "age" ? "YEARS" : modeMeta.short}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
          {slots.map((slot) => {
            const playerId = team[slot.id];
            const p = playerId ? playerMap.get(playerId) ?? null : null;
            const filled = Boolean(p);
            const clickable = !gameOver && !spinning && !filled && turn === side;
            const clubMeta = p ? clubMetaMap.get(p.club) ?? null : null;

            return (
              <div key={`${side}-${slot.id}`} className="flex items-stretch gap-2 sm:gap-3">
                <div
                  className="flex w-[58px] sm:w-20 shrink-0 items-center justify-center rounded-lg px-1 py-3 text-center text-[11px] sm:text-sm font-extrabold"
                  style={{
                    backgroundColor: slotAccentBg,
                    color: slotAccentText,
                  }}
                >
                  {slot.label}
                </div>

                <button
                  className={`${BUTTON_ANIM} flex min-h-[62px] sm:min-h-[58px] flex-1 items-center justify-between gap-2 overflow-hidden rounded-xl border px-3 text-left sm:px-4 ${
                    clickable
                      ? "border-white/40 bg-zinc-900 hover:border-white/60"
                      : "cursor-not-allowed border-white/15 bg-zinc-950"
                  }`}
                  style={
                    p && clubMeta
                      ? {
                          backgroundColor: clubMeta.primary,
                          color: clubMeta.text,
                          borderColor: "rgba(255,255,255,0.24)",
                        }
                      : undefined
                  }
                  onClick={() => onOpen(slot, side)}
                  disabled={!clickable}
                >
                  <div className="min-w-0 flex flex-1 items-center gap-3 overflow-hidden">
                    {p && clubMeta ? (
                      <div className="relative h-8 w-8 shrink-0 sm:h-10 sm:w-10">
                        <Image
                          src={clubMeta.logo}
                          alt={clubMeta.name}
                          fill
                          className="object-contain"
                          sizes="40px"
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
                      className="ml-2 shrink-0 whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] sm:px-2.5 sm:text-sm font-extrabold"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.22)",
                        borderColor: "rgba(255,255,255,0.15)",
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
    );
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10,0,20,0.82), rgba(10,0,20,0.88)), url('/localbackground.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#600083",
      }}
    >
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[0.08em] text-white">
            LOCAL MODE
          </h1>
          <div className="mt-2 text-sm sm:text-base font-semibold text-white/70">
            Two players. Two lineups. ABBA turn order with one club every two picks.
          </div>
        </div>

        <div className="mt-5 sm:mt-6 flex justify-center">
          <ModeDropdown mode={mode} setMode={setMode} disabled={spinning} />
        </div>

        <div className="mt-6 sm:mt-8 flex justify-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12 bg-black/90">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="px-4 py-5 sm:px-7 sm:py-7">
                {renderEditableHeaderName("A", teamNameA)}
                <div className="mt-3 sm:mt-4 flex flex-wrap items-end gap-2">
                  <span className="text-4xl sm:text-6xl font-extrabold leading-none text-cyan-300 break-all">
                    {formatStatValue(scoreA, mode)}
                  </span>
                  <span className="pb-1.5 sm:pb-2 text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.16em] text-white/40">
                    {modeMeta.short}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center border-t border-white/10 px-4 py-5 md:border-x md:border-t-0 sm:px-7 sm:py-7">
                <div className="text-center">
                  <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.24em] sm:tracking-[0.28em] text-white/45">
                    TURN
                  </div>
                  <div className="mt-3 text-xl sm:text-3xl font-extrabold text-white break-words">
                    {gameOver ? winnerText : turn === "A" ? teamNameA.toUpperCase() : teamNameB.toUpperCase()}
                  </div>
                  {!gameOver && (
                    <div className="mt-2 text-xs sm:text-sm font-semibold text-white/55">
                      Pick {pickCount + 1} of {slots.length * 2}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 px-4 py-5 md:border-t-0 sm:px-7 sm:py-7">
                <div className="flex items-center justify-start gap-2 md:justify-end">
                  {renderEditableHeaderName("B", teamNameB)}
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap items-end justify-start gap-2 md:justify-end">
                  <span className="text-4xl sm:text-6xl font-extrabold leading-none text-pink-300 break-all">
                    {formatStatValue(scoreB, mode)}
                  </span>
                  <span className="pb-1.5 sm:pb-2 text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.16em] text-white/40">
                    {modeMeta.short}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-md">
              <button
                onClick={() => resetGame()}
                className={`${BUTTON_ANIM} min-h-[52px] w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-extrabold text-white hover:bg-green-400`}
              >
                NEW GAME
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
          {renderTeamColumn(teamNameA.toUpperCase(), "A", teamA, scoreA, "text-cyan-300")}
          {renderTeamColumn(teamNameB.toUpperCase(), "B", teamB, scoreB, "text-pink-300")}
        </div>

        {!gameOver && (
          <div className="mt-8 text-center sm:mt-12">
            <div className="text-[11px] sm:text-sm font-semibold tracking-[0.24em] sm:tracking-[0.28em] text-white/55">
              DRAFTING FROM
            </div>

            <div className="mt-4 sm:mt-5 flex items-center justify-center">
              <div
                className={`inline-flex w-full max-w-[360px] items-center justify-center gap-3 sm:gap-4 rounded-xl border border-white/10 px-4 py-4 sm:px-6 text-sm sm:text-xl font-extrabold ${
                  spinning ? "scale-[1.015]" : "scale-100"
                } transition-transform duration-75`}
                style={{ backgroundColor: displayClub.primary, color: displayClub.text }}
              >
                <div className="relative h-9 w-9 shrink-0 sm:h-12 sm:w-12">
                  <Image
                    src={displayClub.logo}
                    alt={displayClub.name}
                    fill
                    className="object-contain"
                    sizes="48px"
                    priority
                  />
                </div>
                <span className="min-w-0 truncate">{displayClub.name.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/72" onClick={() => setActive(null)} />

          <div className="relative flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-white/15 bg-zinc-950 shadow-xl sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-3xl">
            <div className="border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3 sm:items-center">
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold tracking-[0.24em] text-white/45">
                    PLAYER SELECT
                  </div>
                  <div className="mt-1 text-sm sm:text-lg font-extrabold tracking-wide text-white">
                    {active.side === "A" ? teamNameA : teamNameB} • Select {active.slotLabel}
                  </div>
                </div>

                <button
                  className={`${BUTTON_ANIM} min-h-[44px] min-w-[44px] rounded-xl border border-white/20 px-3 py-2 text-white hover:bg-white/8`}
                  onClick={() => setActive(null)}
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${active.slotLabel}...`}
                  className="h-[52px] w-full rounded-2xl border border-white/12 bg-black px-4 text-base text-white outline-none placeholder:text-white/35 focus:border-white/25"
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-black p-2 pr-1 overscroll-contain">
              {eligiblePlayers.length === 0 ? (
                <div className="p-4 text-white/60">No eligible players found.</div>
              ) : (
                <div className="space-y-2">
                  {eligiblePlayers.map((p) => {
                    const clubMeta = clubMetaMap.get(p.club);

                    return (
                      <button
                        key={p.id}
                        onClick={() => onPick(p.id)}
                        className={`${BUTTON_ANIM} w-full overflow-hidden rounded-2xl border border-white/10 px-4 py-3 text-left`}
                        style={
                          clubMeta
                            ? {
                                backgroundColor: clubMeta.primary,
                                color: clubMeta.text,
                              }
                            : undefined
                        }
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {clubMeta ? (
                            <div className="relative h-9 w-9 shrink-0">
                              <Image
                                src={clubMeta.logo}
                                alt={clubMeta.name}
                                fill
                                className="object-contain"
                                sizes="36px"
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0 overflow-hidden">
                            <div className="truncate text-base sm:text-lg font-extrabold">{p.name}</div>
                            <div
                              className="truncate text-[11px] sm:text-xs font-semibold"
                              style={{ color: clubMeta ? "rgba(255,255,255,0.82)" : undefined }}
                            >
                              {p.club} • {p.pos.join("/")}
                              {mode !== "number" ? ` • #${Math.round(p.stats.number)}` : ""}
                            </div>
                          </div>
                        </div>
                      </button>
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