"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import players from "@/app/data/afl_players26.json";

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

type ModeOption = {
  key: StatMode;
  label: string;
  short: string;
};

type LeaderboardEntry = {
  id?: string;
  name: string;
  score: number;
  rank: number;
  team?: Record<string, string | null> | null;
};

type PlayerRecord = {
  id: string;
  name: string;
  club: string;
  age?: number;
  number?: number;
  disposals?: number;
  goals?: number;
  kicks?: number;
  handballs?: number;
  marks?: number;
  tackles?: number;
  hitouts?: number;
  sc_points?: number;
  bounces?: number;
  metres_gained?: number;
};

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

const CLUB_LOGOS: Record<string, string> = {
  Adelaide: "/team-icons/adelaide.png",
  "Brisbane Lions": "/team-icons/brisbane.png",
  Carlton: "/team-icons/carlton.png",
  Collingwood: "/team-icons/collingwood.png",
  Essendon: "/team-icons/essendon.png",
  Fremantle: "/team-icons/fremantle.png",
  Geelong: "/team-icons/geelong.png",
  "Gold Coast": "/team-icons/gold-coast.png",
  GWS: "/team-icons/gws.png",
  Hawthorn: "/team-icons/hawthorn.png",
  Melbourne: "/team-icons/melbourne.png",
  "North Melbourne": "/team-icons/north-melbourne.png",
  "Port Adelaide": "/team-icons/port-adelaide.png",
  Richmond: "/team-icons/richmond.png",
  "St Kilda": "/team-icons/st-kilda.png",
  Sydney: "/team-icons/sydney.png",
  "West Coast": "/team-icons/west-coast.png",
  "Western Bulldogs": "/team-icons/western-bulldogs.png",
};

const playerMap: Record<string, PlayerRecord> = Object.fromEntries(
  (players as PlayerRecord[]).map((player) => [player.id, player])
);

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

  return Number(value || 0).toFixed(1);
}

function rankColor(rank: number) {
  if (rank === 1) return "text-[#ffbf2f]";
  if (rank === 2) return "text-white";
  if (rank === 3) return "text-[#d38d4e]";
  return "text-[#8fa4c7]";
}

function scoreColor(rank: number) {
  if (rank <= 2) return "text-cyan-400";
  return "text-fuchsia-500";
}

function normalizeSlot(slot: string) {
  const raw = slot.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (raw.includes("fwd") || raw.includes("for")) return "FWD";
  if (raw.includes("mid")) return "MID";
  if (raw.includes("def") || raw.includes("back")) return "DEF";
  if (raw.includes("ruck")) return "RUCK";
  if (raw.includes("flex") || raw.includes("bench") || raw.includes("util")) return "FLEX";

  return slot.toUpperCase().replace(/[_-]+/g, " ");
}

function slotSortValue(slot: string) {
  const key = normalizeSlot(slot);
  if (key === "FWD") return 1;
  if (key === "MID") return 2;
  if (key === "DEF") return 3;
  if (key === "RUCK") return 4;
  if (key === "FLEX") return 5;
  return 99;
}

function getPlayerRowStyle(index: number) {
  const styles = [
    "bg-[#0f2f67] border-[#3560ad] text-white",
    "bg-[#179fd5] border-[#5bc5ef] text-black",
    "bg-[#f75c1e] border-[#ff8d60] text-black",
    "bg-[#0c3d78] border-[#2d69b5] text-white",
    "bg-[#97004a] border-[#d84c87] text-[#ffe100]",
    "bg-[#1352b8] border-[#4f85dd] text-white",
    "bg-[#cf0000] border-[#ff5454] text-[#ffe100]",
    "bg-[#133874] border-[#3c64ad] text-white",
  ];

  return styles[index % styles.length];
}

function getPlayerRecord(playerValue: string | null) {
  if (!playerValue) return null;
  const trimmed = String(playerValue).trim();
  if (!trimmed) return null;
  return playerMap[trimmed] ?? null;
}

function getPlayerDisplayName(playerValue: string | null) {
  const record = getPlayerRecord(playerValue);
  if (record) return record.name;
  return playerValue ? String(playerValue) : "";
}

function getPlayerClub(playerValue: string | null) {
  const record = getPlayerRecord(playerValue);
  return record?.club ?? "";
}

function getPlayerLogo(playerValue: string | null) {
  const club = getPlayerClub(playerValue);
  return CLUB_LOGOS[club] ?? "";
}

function getPlayerModeScore(playerValue: string | null, mode: StatMode) {
  const record = getPlayerRecord(playerValue);
  if (!record) return null;

  const value = record[mode];
  if (typeof value !== "number") return 0;
  return value;
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
  const current = getModeMeta(mode);

  useEffect(() => {
    setOpen(false);
  }, [mode]);

  useEffect(() => {
    function onDocClick() {
      setOpen(false);
    }

    if (!open) return;

    const handler = () => onDocClick();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <div
      className="relative w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
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

function TeamModal({
  entry,
  mode,
  onClose,
}: {
  entry: LeaderboardEntry | null;
  mode: StatMode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!entry) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [entry, onClose]);

  if (!entry) return null;

  const teamEntries = Object.entries(entry.team ?? {})
    .filter(([, value]) => value && String(value).trim() !== "")
    .sort((a, b) => {
      const slotDiff = slotSortValue(a[0]) - slotSortValue(b[0]);
      if (slotDiff !== 0) return slotDiff;
      return a[0].localeCompare(b[0]);
    });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-3 py-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-[#07111c] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.24em] text-white/50">
              VIEW TEAM
            </div>
            <div className="mt-2 truncate text-2xl font-extrabold text-white sm:text-3xl">
              {entry.name}
            </div>
            <div className="mt-2 text-sm font-bold text-white/70 sm:text-base">
              Exact team for score:{" "}
              <span className="text-[#ffd25f]">
                {formatStatValue(entry.score, mode)} {getModeMeta(mode).short}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-extrabold tracking-[0.12em] text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            CLOSE
          </button>
        </div>

        {teamEntries.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0d1724] px-6 py-12 text-center">
            <div className="text-xl font-extrabold text-white">
              No saved team found
            </div>
            <div className="mt-2 text-sm font-semibold text-white/60">
              This entry does not have team data attached.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {teamEntries.map(([slot, player], index) => {
              const slotLabel = normalizeSlot(slot);
              const rowStyle = getPlayerRowStyle(index);
              const displayName = getPlayerDisplayName(player);
              const club = getPlayerClub(player);
              const logo = getPlayerLogo(player);
              const playerScore = getPlayerModeScore(player, mode);

              return (
                <div
                  key={slot}
                  className="grid grid-cols-[82px_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[94px_minmax(0,1fr)]"
                >
                  <div className="flex min-h-[58px] items-center justify-center rounded-2xl bg-[#efbe00] px-2 text-center text-lg font-black tracking-[0.04em] text-black shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] sm:min-h-[62px]">
                    {slotLabel}
                  </div>

                  <div
                    className={`flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border px-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)] sm:min-h-[62px] sm:px-6 ${rowStyle}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 sm:h-12 sm:w-12">
                        {logo ? (
                          <Image
                            src={logo}
                            alt={club || displayName}
                            width={48}
                            height={48}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="text-[10px] font-black tracking-[0.12em]">
                            {club ? club.slice(0, 3).toUpperCase() : "AFL"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-lg font-extrabold sm:text-[1.65rem]">
                          {displayName}
                        </div>
                        {club ? (
                          <div className="truncate text-xs font-bold opacity-80 sm:text-sm">
                            {club}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-black/20 bg-black/20 px-3 py-2 text-sm font-black tracking-[0.05em] sm:px-4 sm:text-base">
                      {playerScore !== null
                        ? `${formatStatValue(playerScore, mode)} ${getModeMeta(mode).short}`
                        : `0 ${getModeMeta(mode).short}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<StatMode>("sc_points");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [topScore, setTopScore] = useState(0);
  const [topName, setTopName] = useState("—");
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  const modeMeta = useMemo(() => getModeMeta(mode), [mode]);

  async function loadLeaderboard(selectedMode: StatMode) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/ranked/top?mode=${encodeURIComponent(selectedMode)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load leaderboard.");
      }

      setEntries(Array.isArray(data?.entries) ? data.entries : []);
      setTopScore(Number(data?.topScore ?? 0) || 0);
      setTopName(typeof data?.topName === "string" ? data.topName : "—");
      setTotalEntries(Number(data?.totalEntries ?? 0) || 0);
    } catch (err) {
      setEntries([]);
      setTopScore(0);
      setTopName("—");
      setTotalEntries(0);
      setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("leaderboard_selected_mode_2026");
      if (savedMode && MODE_OPTIONS.some((option) => option.key === savedMode)) {
        setMode(savedMode as StatMode);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("leaderboard_selected_mode_2026", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    loadLeaderboard(mode);
  }, [mode]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0 bg-black/45" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-[0.08em] text-white sm:text-4xl">
            GLOBAL LEADERBOARD
          </h1>
          <div className="mt-2 text-sm font-semibold text-white/70 sm:text-base">
            Ranked runs across every stat mode
          </div>
        </div>

        <div className="mt-5 flex justify-center sm:mt-6">
          <ModeDropdown mode={mode} setMode={setMode} disabled={loading} />
        </div>

        <div className="mt-6 grid gap-3 sm:mt-8 md:grid-cols-3">
          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-6 sm:py-6">
            <div className="text-[10px] font-extrabold tracking-[0.24em] text-white/45">
              #1 USER
            </div>
            <div className="mt-3 truncate text-2xl font-extrabold text-white sm:text-3xl">
              {loading ? "Loading..." : topName}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-6 sm:py-6">
            <div className="text-[10px] font-extrabold tracking-[0.24em] text-white/45">
              HIGH SCORE
            </div>
            <div className="mt-3 flex items-end gap-2 flex-wrap">
              <span className="bg-gradient-to-b from-[#fff7c2] via-[#f2cf63] to-[#c78a18] bg-clip-text text-4xl font-extrabold leading-none text-transparent sm:text-5xl">
                {loading ? "..." : formatStatValue(topScore, mode)}
              </span>
              <span className="pb-1 text-xs font-bold tracking-[0.16em] text-[#d7bb67] sm:text-sm">
                {modeMeta.short}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-6 sm:py-6">
            <div className="text-[10px] font-extrabold tracking-[0.24em] text-white/45">
              TOTAL ENTRIES
            </div>
            <div className="mt-3 text-4xl font-extrabold leading-none text-white sm:text-5xl">
              {loading ? "..." : totalEntries}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#2f3b52] bg-[#101317]/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:mt-8">
          <div className="grid grid-cols-[72px_minmax(0,1fr)_90px_110px] border-b border-[#253047] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70 sm:grid-cols-[100px_minmax(0,1fr)_160px_140px] sm:px-6">
            <div>Rank</div>
            <div>User</div>
            <div>High Score</div>
            <div className="text-right">Team</div>
          </div>

          {error ? (
            <div className="px-4 py-10 text-center sm:px-6">
              <div className="text-lg font-extrabold text-red-300">Could not load leaderboard</div>
              <div className="mt-2 text-sm font-semibold text-white/65">{error}</div>
            </div>
          ) : loading ? (
            <div className="px-4 py-4 sm:px-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[58px] animate-pulse border-b border-[#253047] bg-white/[0.03]" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-12 text-center sm:px-6">
              <div className="text-xl font-extrabold text-white">No scores yet</div>
              <div className="mt-2 text-sm font-semibold text-white/60">
                Be the first to submit a ranked score in {modeMeta.label}.
              </div>
            </div>
          ) : (
            <div>
              {entries.map((entry) => (
                <div
                  key={`${entry.id ?? entry.name}-${entry.rank}-${entry.score}`}
                  className="grid grid-cols-[72px_minmax(0,1fr)_90px_110px] items-center gap-2 border-b border-[#253047] px-4 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[100px_minmax(0,1fr)_160px_140px] sm:px-6"
                >
                  <div className={`text-xl font-extrabold ${rankColor(entry.rank)}`}>
                    {entry.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-base font-extrabold text-white sm:text-xl">
                      {entry.name}
                    </div>
                  </div>

                  <div className={`text-base font-extrabold sm:text-xl ${scoreColor(entry.rank)}`}>
                    {formatStatValue(entry.score, mode)}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-extrabold tracking-[0.14em] text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 hover:text-cyan-200 sm:text-xs"
                    >
                      VIEW TEAM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TeamModal
        entry={selectedEntry}
        mode={mode}
        onClose={() => setSelectedEntry(null)}
      />
    </main>
  );
}