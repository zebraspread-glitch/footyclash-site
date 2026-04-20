"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import {
  Copy,
  Gamepad2,
  Gauge,
  LogIn,
  Shield,
  Trophy,
  Users,
  X,
} from "lucide-react";
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

type RoomState = {
  roomId: string;
  hostName: string;
  guestName: string;
  mode: StatMode;
  teamA: Record<string, string | null>;
  teamB: Record<string, string | null>;
  pickCount: number;
  clubName: string;
  started: boolean;
  status: "waiting" | "playing" | "finished";
  connectedCount: number;
  hostSocketId: string;
  guestSocketId: string | null;
  turnExpiresAt: number | null;
  turnSecondsLeft: number;
};

type LobbyConfig = {
  mode: StatMode;
  hostAsA: boolean;
  timerSeconds: 20 | 30 | 45;
};

type FinalSnapshot = {
  roomId: string;
  mode: StatMode;
  slots: Slot[];
  teamA: Record<string, string | null>;
  teamB: Record<string, string | null>;
  scoreA: number;
  scoreB: number;
  sideAName: string;
  sideBName: string;
  winnerText: string;
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
  "transition-all duration-150 ease-out hover:scale-[1.01] active:scale-[0.985]";

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

function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.resolve();
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getSocketUrl() {
  if (typeof window === "undefined") return "";

  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (envUrl) return envUrl;

  const { protocol, hostname } = window.location;
  const localHosts = ["localhost", "127.0.0.1"];

  if (localHosts.includes(hostname)) {
    return `http://${hostname}:3001`;
  }

  return `${protocol}//${hostname}:3001`;
}

function LandingCard({
  title,
  subtitle,
  icon,
  colorClass,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BUTTON_ANIM} group w-full rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,30,0.96),rgba(12,22,36,0.96))] px-4 py-5 sm:px-6 sm:py-6 text-left shadow-[0_12px_32px_rgba(0,0,0,0.28)] hover:border-white/20`}
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-xl sm:text-[22px] font-extrabold tracking-[0.02em] text-white">
            {title}
          </div>
          <div className="mt-1 text-xs sm:text-[17px] text-white/58 sm:leading-6">
            {subtitle}
          </div>
        </div>
      </div>
    </button>
  );
}

function SimpleOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BUTTON_ANIM} min-h-[48px] rounded-xl border px-4 py-3 text-sm font-extrabold tracking-[0.04em] ${
        active
          ? "border-blue-400/60 bg-blue-500/20 text-white"
          : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {label}
    </button>
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

export default function OnlinePage() {
  const socketRef = useRef<Socket | null>(null);
  const pendingCreateConfigRef = useRef<LobbyConfig | null>(null);
  const configAppliedForRoomRef = useRef<string | null>(null);
  const timeoutAutoPickKeyRef = useRef<string | null>(null);

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

  const [connected, setConnected] = useState(false);
  const [nickname, setNickname] = useState("Player");
  const [roomInput, setRoomInput] = useState("");
  const [mySide, setMySide] = useState<"A" | "B" | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [finalSnapshot, setFinalSnapshot] = useState<FinalSnapshot | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ActivePicker | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [lobbyConfig, setLobbyConfig] = useState<LobbyConfig>({
    mode: "sc_points",
    hostAsA: true,
    timerSeconds: 30,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("online_player_name");
      if (saved?.trim()) setNickname(saved.trim().slice(0, 13));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("online_player_name", nickname);
    } catch {}
  }, [nickname]);

  useEffect(() => {
    const url = getSocketUrl();

    const socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError("");
      setInfo("");
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      setInfo(`Disconnected: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      setError(`Connect error: ${err.message}`);
    });

    socket.on("room_state", (data: RoomState) => {
      setRoom(data);
    });

    socket.on("assigned_side", ({ side }: { side: "A" | "B" }) => {
      setMySide(side);
    });

    socket.on("room_error", ({ message }: { message: string }) => {
      setError(message);
    });

    socket.on("room_info", ({ message }: { message: string }) => {
      setInfo(message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !room || room.started) return;
    if (!room.hostSocketId || socket.id !== room.hostSocketId) return;

    const pending = pendingCreateConfigRef.current;
    if (!pending) return;
    if (configAppliedForRoomRef.current === room.roomId) return;

    socket.emit("set_lobby_config", {
      roomId: room.roomId,
      mode: pending.mode,
      hostAsA: pending.hostAsA,
      timerSeconds: pending.timerSeconds,
    });

    configAppliedForRoomRef.current = room.roomId;
    pendingCreateConfigRef.current = null;
  }, [room]);

  const mode = room?.mode ?? lobbyConfig.mode;
  const slots = useMemo(() => getSlotsForMode(mode), [mode]);

  const pickedIds = useMemo(() => {
    const ids = new Set<string>();
    if (!room) return ids;
    for (const id of Object.values(room.teamA)) if (id) ids.add(id);
    for (const id of Object.values(room.teamB)) if (id) ids.add(id);
    return ids;
  }, [room]);

  const turn = room ? getTurnFromPickNumber(room.pickCount) : "A";
  const teamA = room?.teamA ?? createEmptyTeam(slots);
  const teamB = room?.teamB ?? createEmptyTeam(slots);

  const scoreA = useMemo(() => sumModeStatFast(teamA, playerMap, mode), [teamA, playerMap, mode]);
  const scoreB = useMemo(() => sumModeStatFast(teamB, playerMap, mode), [teamB, playerMap, mode]);

  const allFilledA = useMemo(() => slots.every((slot) => Boolean(teamA[slot.id])), [slots, teamA]);
  const allFilledB = useMemo(() => slots.every((slot) => Boolean(teamB[slot.id])), [slots, teamB]);
  const gameOver = allFilledA && allFilledB;

  const getDeterministicClubForStep = useCallback(
    (roomId: string, currentMode: StatMode, step: number) => {
      const availableClubs = AFL_CLUBS.filter((club) => {
        const players = playersByClubAndMode.get(currentMode)?.get(club.name) ?? [];
        return players.length > 0;
      });

      if (availableClubs.length === 0) return AFL_CLUBS[0].name;

      const seed = hashString(`${roomId}-${currentMode}`);
      const index = (seed + step) % availableClubs.length;
      return availableClubs[index].name;
    },
    [playersByClubAndMode]
  );

  const roomClub = useMemo(() => {
    if (!room) return AFL_CLUBS[0].name;
    const step = Math.floor(room.pickCount / 2);
    return getDeterministicClubForStep(room.roomId, mode, step);
  }, [room, mode, getDeterministicClubForStep]);

  const displayClub = clubMetaMap.get(roomClub) ?? AFL_CLUBS[0];

  const isHost = Boolean(room && socketRef.current && room.hostSocketId === socketRef.current.id);
  const isMyTurn = mySide != null && turn === mySide;
  const modeMeta = getModeMeta(mode);
  const turnSecondsLeft = room?.turnSecondsLeft ?? lobbyConfig.timerSeconds;

  const secondPlayerJoined = Boolean(
    room &&
      ((room.connectedCount ?? 0) >= 2 ||
        room.guestSocketId ||
        room.guestName.length > 0 ||
        mySide === "B")
  );

  const derivedHostSide: "A" | "B" = useMemo(() => {
    if (!room) return lobbyConfig.hostAsA ? "A" : "B";
    if (mySide) {
      return isHost ? mySide : mySide === "A" ? "B" : "A";
    }
    return lobbyConfig.hostAsA ? "A" : "B";
  }, [room, mySide, isHost, lobbyConfig.hostAsA]);

  const sideAName =
    derivedHostSide === "A"
      ? room?.hostName?.trim() || "PLAYER A"
      : room?.guestName?.trim() || (secondPlayerJoined ? "PLAYER A" : "WAITING...");

  const sideBName =
    derivedHostSide === "B"
      ? room?.hostName?.trim() || "PLAYER B"
      : room?.guestName?.trim() || (secondPlayerJoined ? "PLAYER B" : "WAITING...");

  const hostDisplayName = room?.hostName?.trim() || "PLAYER";
  const guestDisplayName =
    room?.guestName?.trim() || (secondPlayerJoined ? "PLAYER" : "WAITING...");

  const winnerText =
    scoreA > scoreB
      ? `${sideAName.toUpperCase()} WINS`
      : scoreB > scoreA
        ? `${sideBName.toUpperCase()} WINS`
        : "DRAW";

  const clubPlayers = useMemo(() => {
    return playersByClubAndMode.get(mode)?.get(roomClub) ?? [];
  }, [playersByClubAndMode, mode, roomClub]);

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
  }, [active, clubPlayers, pickedIds, search]);

  useEffect(() => {
    if (!active) return;

    if (!room?.started || gameOver || !isMyTurn) {
      setActive(null);
      setSearch("");
    }
  }, [active, room?.started, gameOver, isMyTurn]);

  useEffect(() => {
    if (!room || !gameOver) return;

    setFinalSnapshot({
      roomId: room.roomId,
      mode,
      slots,
      teamA: { ...teamA },
      teamB: { ...teamB },
      scoreA,
      scoreB,
      sideAName,
      sideBName,
      winnerText,
    });

    setActive(null);
    setSearch("");
  }, [room, gameOver, mode, slots, teamA, teamB, scoreA, scoreB, sideAName, sideBName, winnerText]);

  const createRoom = useCallback(() => {
    const socket = socketRef.current;

    if (!socket || !connected) {
      setError("Not connected to socket server.");
      return;
    }

    const trimmed = nickname.trim().slice(0, 13) || "Player A";
    pendingCreateConfigRef.current = lobbyConfig;
    configAppliedForRoomRef.current = null;

    setFinalSnapshot(null);
    setError("");
    setInfo("");
    setShowSettingsModal(false);

    socket.emit("create_room", { name: trimmed });
  }, [nickname, connected, lobbyConfig]);

  const joinRoom = useCallback(() => {
    const socket = socketRef.current;

    if (!socket || !connected) {
      setError("Not connected to socket server.");
      return;
    }

    const trimmed = nickname.trim().slice(0, 13) || "Player B";
    const roomId = roomInput.trim().toUpperCase();

    if (roomId.length !== 6) {
      setError("Enter a valid 6-character room code.");
      return;
    }

    setFinalSnapshot(null);
    setError("");
    setInfo("");
    setShowJoinModal(false);

    socket.emit("join_room", { roomId, name: trimmed });
  }, [nickname, roomInput, connected]);

  const startGame = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !room) return;
    setFinalSnapshot(null);
    socket.emit("start_game", { roomId: room.roomId });
  }, [room]);

  const changeMode = useCallback(
    (nextMode: StatMode) => {
      const socket = socketRef.current;
      if (!socket || !room) return;
      socket.emit("set_mode", { roomId: room.roomId, mode: nextMode });
    },
    [room]
  );

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket && room?.roomId) {
      socket.emit("leave_room", { roomId: room.roomId });
    }

    pendingCreateConfigRef.current = null;
    configAppliedForRoomRef.current = null;
    timeoutAutoPickKeyRef.current = null;
    setRoom(null);
    setMySide(null);
    setSearch("");
    setActive(null);
    setInfo("");
    setError("");
    setRoomInput("");
    setShowSettingsModal(false);
    setShowJoinModal(false);
  }, [room]);

  const handlePlayAgain = useCallback(() => {
    leaveRoom();
    setFinalSnapshot(null);
  }, [leaveRoom]);

  const onOpen = useCallback(
    (slot: Slot, side: "A" | "B") => {
      if (!room?.started || gameOver) return;
      if (mySide !== side) return;
      if (!isMyTurn) return;

      const selectedTeam = side === "A" ? teamA : teamB;
      if (selectedTeam[slot.id]) return;

      setSearch("");
      setActive({
        slotId: slot.id,
        allowed: slot.allowed,
        slotLabel: slot.label,
        side,
      });
    },
    [room?.started, gameOver, mySide, isMyTurn, teamA, teamB]
  );

  const onPick = useCallback(
    (playerId: string) => {
      const socket = socketRef.current;
      if (!socket || !room || !active || !isMyTurn || gameOver) return;

      socket.emit("pick_player", {
        roomId: room.roomId,
        slotId: active.slotId,
        playerId,
      });

      setActive(null);
      setSearch("");
    },
    [room, active, isMyTurn, gameOver]
  );

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !room?.started || gameOver) return;
    if (!isHost) return;
    if (turnSecondsLeft > 0) return;

    const expiredTurn: "A" | "B" = getTurnFromPickNumber(room.pickCount);
    const autoPickKey = `${room.roomId}-${room.pickCount}-${expiredTurn}`;

    if (timeoutAutoPickKeyRef.current === autoPickKey) return;

    const targetTeam = expiredTurn === "A" ? teamA : teamB;
    const emptySlots = slots.filter((slot) => !targetTeam[slot.id]);
    if (emptySlots.length === 0) return;

    type CandidateMove = {
      slotId: string;
      playerId: string;
      stat: number;
      playerName: string;
      slotIndex: number;
    };

    const candidates: CandidateMove[] = [];

    for (let slotIndex = 0; slotIndex < emptySlots.length; slotIndex += 1) {
      const slot = emptySlots[slotIndex];

      for (const player of clubPlayers) {
        if (pickedIds.has(player.id)) continue;
        if (!player.pos.some((pos) => slot.allowed.includes(pos))) continue;

        candidates.push({
          slotId: slot.id,
          playerId: player.id,
          stat: player.stats[mode] ?? 0,
          playerName: player.name,
          slotIndex,
        });
      }
    }

    if (candidates.length === 0) return;

    candidates.sort((a, b) => {
      if (a.stat !== b.stat) return a.stat - b.stat;
      if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
      return a.playerName.localeCompare(b.playerName);
    });

    const worstMove = candidates[0];
    timeoutAutoPickKeyRef.current = autoPickKey;

    socket.emit("pick_player", {
      roomId: room.roomId,
      slotId: worstMove.slotId,
      playerId: worstMove.playerId,
    });

    setActive(null);
    setSearch("");
  }, [
    room,
    gameOver,
    isHost,
    turnSecondsLeft,
    teamA,
    teamB,
    slots,
    clubPlayers,
    pickedIds,
    mode,
  ]);

  async function copyInviteMessage() {
    if (!room?.roomId) return;
    try {
      await copyText(`Join my FootyClash lobby: ${room.roomId}`);
      setInfo("Invite code copied.");
    } catch {
      setInfo("Could not copy invite code.");
    }
  }

  function renderTeamColumn(
    title: string,
    side: "A" | "B",
    team: Record<string, string | null>,
    score: number,
    accentClasses: string,
    overrideMode?: StatMode,
    overrideSlots?: Slot[]
  ) {
    const resolvedMode = overrideMode ?? mode;
    const resolvedModeMeta = getModeMeta(resolvedMode);
    const resolvedSlots = overrideSlots ?? slots;

    const slotAccentBg = side === "A" ? TEAM_A_ACCENT_BG : TEAM_B_ACCENT_BG;
    const slotAccentText = side === "A" ? TEAM_A_ACCENT_TEXT : TEAM_B_ACCENT_TEXT;
    const isSideTurn = turn === side;
    const iAmThisSide = mySide === side;
    const allowClicks = !overrideMode;

    return (
      <div className="rounded-2xl border border-white/12 bg-black/90 p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`text-lg sm:text-2xl font-extrabold tracking-[0.08em] ${accentClasses}`}>
              {title}
            </div>
            <div className="mt-1 text-xs sm:text-sm font-semibold text-white/60">
              {overrideMode
                ? "Final Team"
                : gameOver
                  ? "Finished"
                  : isSideTurn
                    ? iAmThisSide
                      ? "Your turn"
                      : "Picking now"
                    : "Waiting"}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[10px] font-extrabold tracking-[0.2em] sm:tracking-[0.22em] text-white/45 sm:text-[11px]">
              SCORE
            </div>
            <div className="mt-1 text-2xl sm:text-4xl font-extrabold text-white">
              {formatStatValue(score, resolvedMode)}
            </div>
            <div className="text-[10px] sm:text-xs font-bold tracking-[0.16em] sm:tracking-[0.18em] text-white/45">
              {resolvedMode === "age" ? "YEARS" : resolvedModeMeta.short}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
          {resolvedSlots.map((slot) => {
            const playerId = team[slot.id];
            const p = playerId ? playerMap.get(playerId) ?? null : null;
            const filled = Boolean(p);
            const clickable =
              allowClicks && !gameOver && room?.started && !filled && isMyTurn && mySide === side;
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
                      : "cursor-default border-white/15 bg-zinc-950"
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
                  onClick={() => {
                    if (clickable) onOpen(slot, side);
                  }}
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
                      className="ml-2 shrink-0 whitespace-nowrap rounded-lg border px-2 py-1 sm:px-2.5 text-[10px] sm:text-sm font-extrabold"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.22)",
                        borderColor: "rgba(255,255,255,0.15)",
                        color: clubMeta?.text ?? "#fff",
                      }}
                    >
                      {formatStatValue(p.stats[resolvedMode], resolvedMode)}{" "}
                      {resolvedMode === "age" ? "Years" : resolvedModeMeta.short}
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

  const joinCodeValid = roomInput.trim().length === 6;
  const showResultOverlay = Boolean(finalSnapshot);
  const showLiveDraft = Boolean(room && room.started);

  return (
    <main
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(4,10,24,0.82), rgba(4,10,24,0.9)), url('/localbackground.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#07101c",
      }}
    >
      <div className="mx-auto max-w-7xl px-3 py-5 pb-28 sm:px-6 sm:py-10 sm:pb-36">
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[0.08em] text-white">
            ONLINE MODE
          </h1>
          <div className="mt-2 text-sm sm:text-base font-semibold text-white/70">
            Live room codes. Real-time drafting.
          </div>
        </div>

        <div className="mt-5 sm:mt-6 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/80 px-4 py-3">
            <div className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
            <div className="text-sm font-bold text-white/75">
              {connected ? "Connected to server" : "Disconnected"}
            </div>
          </div>

          {!room && !showResultOverlay && (
            <div className="w-full max-w-4xl space-y-4 sm:space-y-5 pt-2 sm:pt-4">
              <div className="mx-auto max-w-3xl">
                <LandingCard
                  title="HOST GAME"
                  subtitle="Host a private FootyClash match and choose the rules."
                  colorClass="bg-sky-500 text-black"
                  icon={<Gamepad2 size={30} strokeWidth={2.8} />}
                  onClick={() => setShowSettingsModal(true)}
                />
              </div>

              <div className="mx-auto max-w-3xl">
                <LandingCard
                  title="JOIN GAME"
                  subtitle="Enter a room code to join someone else's match."
                  colorClass="bg-green-500 text-black"
                  icon={<LogIn size={30} strokeWidth={2.8} />}
                  onClick={() => setShowJoinModal(true)}
                />
              </div>
            </div>
          )}

          {room && !room.started && !showResultOverlay && (
            <div className="w-full max-w-3xl rounded-[24px] sm:rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(13,19,33,0.96))] p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="text-center">
                <div className="text-2xl sm:text-5xl font-black tracking-tight text-white break-words">
                  {getModeMeta(mode).label.toUpperCase()}
                </div>

                <div className="mx-auto mt-4 sm:mt-5 flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-[#0b1524] px-4 sm:px-6 py-3 sm:py-4">
                  <span className="text-xs sm:text-sm font-bold tracking-[0.14em] text-white/45">CODE</span>
                  <span className="text-2xl sm:text-3xl font-black tracking-[0.22em] text-blue-400">
                    {room.roomId}
                  </span>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-white/15 bg-[#0b1524] text-white">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-blue-500 px-2 py-1 text-[10px] font-black tracking-[0.16em] text-white">
                      HOST
                    </div>
                    <Users size={30} />
                  </div>
                  <div className="mt-3 text-center text-base sm:text-xl font-black text-white break-words">
                    {hostDisplayName.toUpperCase()}
                  </div>
                </div>

                <div className="text-center text-3xl sm:text-5xl font-black text-white/30">VS</div>

                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-[#0b1524] ${
                      secondPlayerJoined
                        ? "border border-white/15 text-white"
                        : "border border-dashed border-white/20 text-white/40"
                    }`}
                  >
                    {secondPlayerJoined ? <Users size={30} /> : <Shield size={30} />}
                  </div>

                  <div
                    className={`mt-3 text-center text-base sm:text-xl font-black break-words ${
                      secondPlayerJoined ? "text-white" : "text-white/35"
                    }`}
                  >
                    {guestDisplayName.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 text-center text-sm sm:text-base font-bold tracking-[0.08em] text-white/35">
                {secondPlayerJoined
                  ? isHost
                    ? "OPPONENT JOINED. START WHEN READY."
                    : "WAITING FOR HOST TO START..."
                  : "WAITING FOR AN OPPONENT TO JOIN..."}
              </div>

              {secondPlayerJoined && isHost ? (
                <div className="mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={startGame}
                    className={`${BUTTON_ANIM} flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-4 text-base sm:text-lg font-extrabold text-white hover:bg-blue-500`}
                  >
                    START DRAFT
                  </button>
                </div>
              ) : null}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={copyInviteMessage}
                  className={`${BUTTON_ANIM} flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-white/10 px-5 py-4 text-base sm:text-lg font-extrabold text-white hover:bg-white/15`}
                >
                  <Copy size={20} />
                  COPY INVITE CODE
                </button>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={leaveRoom}
                  className={`${BUTTON_ANIM} rounded-2xl border border-white/15 bg-[#0b1524] px-5 py-3 text-sm font-extrabold text-white hover:bg-white/8`}
                >
                  LEAVE LOBBY
                </button>
              </div>
            </div>
          )}

          {(error || info) && !showResultOverlay && (
            <div className="w-full max-w-3xl space-y-2">
              {error ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {error}
                </div>
              ) : null}
              {info ? (
                <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100">
                  {info}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {showLiveDraft && !showResultOverlay && (
          <>
            <div className="mt-5 sm:mt-6 flex justify-center">
              <ModeDropdown mode={mode} setMode={changeMode} disabled={!room?.started || !isHost} />
            </div>

            <div className="mt-6 sm:mt-8 flex justify-center">
              <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/12 bg-black/90">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="px-4 py-5 sm:px-7 sm:py-7">
                    <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.24em] sm:tracking-[0.28em] text-white/45">
                      {sideAName.toUpperCase()}
                    </div>
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
                        {turn === "A" ? sideAName.toUpperCase() : sideBName.toUpperCase()}
                      </div>
                      <div className="mt-2 text-xs sm:text-sm font-semibold text-white/55">
                        Pick {(room?.pickCount ?? 0) + 1} of {slots.length * 2}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-4 py-5 md:border-t-0 sm:px-7 sm:py-7">
                    <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.24em] sm:tracking-[0.28em] text-white/45 md:text-right">
                      {sideBName.toUpperCase()}
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

            {!gameOver && (
              <div className="mt-8 text-center sm:mt-12">
                <div className="text-[11px] sm:text-sm font-semibold tracking-[0.24em] sm:tracking-[0.28em] text-white/55">
                  DRAFTING FROM
                </div>

                <div className="mt-4 sm:mt-5 flex items-center justify-center">
                  <div
                    className="inline-flex w-full max-w-[360px] items-center justify-center gap-3 sm:gap-4 rounded-xl border border-white/10 px-4 py-4 sm:px-6 text-sm sm:text-xl font-extrabold transition-transform duration-75"
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

            <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
              {renderTeamColumn(sideAName.toUpperCase(), "A", teamA, scoreA, "text-cyan-300")}
              {renderTeamColumn(sideBName.toUpperCase(), "B", teamB, scoreB, "text-pink-300")}
            </div>
          </>
        )}
      </div>

      {room?.started && !showResultOverlay && (
        <div className="fixed bottom-3 sm:bottom-5 left-1/2 z-40 w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
          <div className="rounded-2xl border border-white/12 bg-black/90 px-5 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="text-[11px] font-extrabold tracking-[0.24em] text-white/45">
              TURN TIMER
            </div>
            <div className="mt-1 text-3xl font-extrabold text-white">
              {turnSecondsLeft}s
            </div>
            <div className="mt-1 text-xs font-semibold text-white/55 break-words">
              {turn === "A" ? sideAName.toUpperCase() : sideBName.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && !room && !showResultOverlay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-[4px]"
            onClick={() => setShowSettingsModal(false)}
          />

          <div className="relative flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/12 bg-[#0d1522] shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:h-auto sm:max-w-2xl sm:rounded-[28px] sm:p-0">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className={`${BUTTON_ANIM} absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-white/45 hover:bg-white/8 hover:text-white`}
            >
              <X size={20} />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <div className="pr-12">
                <div className="text-sm font-extrabold tracking-[0.22em] text-blue-400">PRIVATE MATCH</div>
                <div className="mt-2 text-2xl sm:text-4xl font-black text-white">Lobby Settings</div>
                <div className="mt-2 text-sm sm:text-base font-semibold text-white/55">
                  Pick a mode, host side, and timer, then create your room.
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm font-extrabold tracking-[0.14em] text-white">
                    YOUR NAME
                  </div>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 13))}
                    placeholder="Your name"
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-[#0a1320] px-4 text-center text-base font-bold text-white outline-none placeholder:text-white/30 focus:border-white/20"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-sm font-extrabold tracking-[0.14em] text-white">STAT MODE</div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {MODE_OPTIONS.map((option) => (
                      <SimpleOption
                        key={option.key}
                        active={lobbyConfig.mode === option.key}
                        label={option.label.toUpperCase()}
                        onClick={() => setLobbyConfig((prev) => ({ ...prev, mode: option.key }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-extrabold tracking-[0.14em] text-white">
                      <Users size={16} />
                      HOST POSITION
                    </div>
                    <div className="grid gap-2.5">
                      <SimpleOption
                        active={lobbyConfig.hostAsA}
                        label="HOST = PLAYER A"
                        onClick={() => setLobbyConfig((prev) => ({ ...prev, hostAsA: true }))}
                      />
                      <SimpleOption
                        active={!lobbyConfig.hostAsA}
                        label="HOST = PLAYER B"
                        onClick={() => setLobbyConfig((prev) => ({ ...prev, hostAsA: false }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-extrabold tracking-[0.14em] text-white">
                      <Gauge size={16} />
                      TURN TIMER
                    </div>
                    <div className="grid gap-2.5">
                      {[20, 30, 45].map((seconds) => (
                        <SimpleOption
                          key={seconds}
                          active={lobbyConfig.timerSeconds === seconds}
                          label={`${seconds} SECONDS`}
                          onClick={() =>
                            setLobbyConfig((prev) => ({
                              ...prev,
                              timerSeconds: seconds as 20 | 30 | 45,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={createRoom}
                    className={`${BUTTON_ANIM} min-h-[54px] w-full rounded-2xl bg-blue-600 px-6 py-4 text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white hover:bg-blue-500`}
                  >
                    Create Lobby
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && !room && !showResultOverlay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/78 backdrop-blur-[4px]"
            onClick={() => setShowJoinModal(false)}
          />

          <div className="relative flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/12 bg-[#111b2b] shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:h-auto sm:max-w-[520px] sm:rounded-[28px]">
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className={`${BUTTON_ANIM} absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-white/45 hover:bg-white/8 hover:text-white`}
            >
              <X size={20} />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <div className="text-center">
                <div className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  JOIN <span className="text-green-500">GAME</span>
                </div>
                <div className="mt-3 text-[11px] sm:text-sm font-extrabold tracking-[0.14em] text-white/40">
                  ENTER THE 6-CHARACTER CODE FROM YOUR HOST
                </div>
              </div>

              <div className="mt-8 rounded-[18px] border border-white/10 bg-[#091425] px-4 py-5 sm:px-6 sm:py-6">
                <input
                  value={roomInput}
                  onChange={(e) =>
                    setRoomInput(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6)
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && joinCodeValid) joinRoom();
                  }}
                  placeholder="Code"
                  maxLength={6}
                  className="w-full bg-transparent text-center text-2xl sm:text-5xl font-black uppercase tracking-[0.3em] sm:tracking-[0.45em] text-white outline-none placeholder:text-[#334763]"
                />
              </div>

              <div className="mt-4">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 13))}
                  placeholder="Your name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && joinCodeValid) joinRoom();
                  }}
                  className="h-[52px] w-full rounded-2xl border border-white/10 bg-[#0a1320] px-4 text-center text-base font-bold text-white outline-none placeholder:text-white/30 focus:border-white/20"
                />
              </div>

              <button
                type="button"
                onClick={joinRoom}
                disabled={!joinCodeValid}
                className={`${BUTTON_ANIM} mt-6 min-h-[54px] w-full rounded-[18px] px-6 py-5 text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white ${
                  joinCodeValid
                    ? "bg-green-600 hover:bg-green-500"
                    : "cursor-not-allowed bg-[#2d4d3b] text-white/55"
                }`}
              >
                JOIN LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {active && room?.started && !showResultOverlay && (
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
                    {active.side === "A" ? sideAName : sideBName} • Select {active.slotLabel}
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

      {showResultOverlay && finalSnapshot && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[rgba(3,8,18,0.82)] backdrop-blur-md">
          <div className="min-h-screen px-3 py-5 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-[24px] sm:rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(9,15,28,0.98),rgba(6,10,18,0.98))] p-4 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-[0_10px_30px_rgba(250,204,21,0.25)]">
                    <Trophy size={30} strokeWidth={2.6} />
                  </div>

                  <div className="mt-4 text-[11px] sm:text-xs font-extrabold tracking-[0.24em] sm:tracking-[0.28em] text-white/45">
                    FINAL RESULT
                  </div>

                  <div className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white break-words">
                    {finalSnapshot.winnerText}
                  </div>

                  <div className="mt-3 text-sm sm:text-base font-semibold text-white/60">
                    {getModeMeta(finalSnapshot.mode).label} • Room {finalSnapshot.roomId}
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-5 text-center">
                    <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] sm:tracking-[0.24em] text-cyan-200/70">
                      {finalSnapshot.sideAName.toUpperCase()}
                    </div>
                    <div className="mt-2 text-4xl sm:text-5xl font-black text-cyan-300">
                      {formatStatValue(finalSnapshot.scoreA, finalSnapshot.mode)}
                    </div>
                    <div className="mt-1 text-xs font-bold tracking-[0.18em] text-cyan-100/60">
                      {getModeMeta(finalSnapshot.mode).short}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 text-center">
                    <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] sm:tracking-[0.24em] text-white/45">
                      RESULT
                    </div>
                    <div className="mt-3 text-xl sm:text-2xl font-black text-white break-words">
                      {finalSnapshot.scoreA > finalSnapshot.scoreB
                        ? finalSnapshot.sideAName.toUpperCase()
                        : finalSnapshot.scoreB > finalSnapshot.scoreA
                          ? finalSnapshot.sideBName.toUpperCase()
                          : "DRAW"}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white/55">
                      Final scores locked in
                    </div>
                  </div>

                  <div className="rounded-2xl border border-pink-400/20 bg-pink-400/10 px-5 py-5 text-center">
                    <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] sm:tracking-[0.24em] text-pink-200/70">
                      {finalSnapshot.sideBName.toUpperCase()}
                    </div>
                    <div className="mt-2 text-4xl sm:text-5xl font-black text-pink-300">
                      {formatStatValue(finalSnapshot.scoreB, finalSnapshot.mode)}
                    </div>
                    <div className="mt-1 text-xs font-bold tracking-[0.18em] text-pink-100/60">
                      {getModeMeta(finalSnapshot.mode).short}
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                  {renderTeamColumn(
                    finalSnapshot.sideAName.toUpperCase(),
                    "A",
                    finalSnapshot.teamA,
                    finalSnapshot.scoreA,
                    "text-cyan-300",
                    finalSnapshot.mode,
                    finalSnapshot.slots
                  )}

                  {renderTeamColumn(
                    finalSnapshot.sideBName.toUpperCase(),
                    "B",
                    finalSnapshot.teamB,
                    finalSnapshot.scoreB,
                    "text-pink-300",
                    finalSnapshot.mode,
                    finalSnapshot.slots
                  )}
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handlePlayAgain}
                    className={`${BUTTON_ANIM} inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-green-500 px-6 py-4 text-base font-extrabold text-white hover:bg-green-400`}
                  >
                    PLAY AGAIN
                  </button>

                  <button
                    type="button"
                    onClick={leaveRoom}
                    className={`${BUTTON_ANIM} inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-base font-extrabold text-white hover:bg-white/12`}
                  >
                    LEAVE ROOM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}