"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
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

type LeaderboardRange = "daily" | "weekly" | "monthly" | "all_time";

type ModeOption = {
  key: StatMode;
  label: string;
  short: string;
};

type RangeOption = {
  key: LeaderboardRange;
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

type ClubTheme = {
  row: string;
  pill: string;
};

type LeaderboardResponse = {
  topScore?: number;
  topName?: string;
  totalEntries?: number;
  entries?: LeaderboardEntry[];
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

const RANGE_OPTIONS: RangeOption[] = [
  { key: "daily", label: "Daily", short: "DAY" },
  { key: "weekly", label: "Weekly", short: "WEEK" },
  { key: "monthly", label: "Monthly", short: "MONTH" },
  { key: "all_time", label: "All Time", short: "ALL" },
];

const CLUB_LOGOS: Record<string, string> = {
  Adelaide: "/team-logos/crows.png",
  "Brisbane Lions": "/team-logos/lions.png",
  Carlton: "/team-logos/blues.png",
  Collingwood: "/team-logos/magpies.png",
  Essendon: "/team-logos/bombers.png",
  Fremantle: "/team-logos/dockers.png",
  Geelong: "/team-logos/cats.png",
  "Gold Coast": "/team-logos/suns.png",
  GWS: "/team-logos/giants.png",
  Hawthorn: "/team-logos/hawks.png",
  Melbourne: "/team-logos/demons.png",
  "North Melbourne": "/team-logos/kangaroos.png",
  "Port Adelaide": "/team-logos/power.png",
  Richmond: "/team-logos/tigers.png",
  "St Kilda": "/team-logos/saints.png",
  Sydney: "/team-logos/swans.png",
  "West Coast": "/team-logos/eagles.png",
  "Western Bulldogs": "/team-logos/bulldogs.png",
};

const CLUB_THEMES: Record<string, ClubTheme> = {
  Adelaide: {
    row: "bg-[#002b5c] text-[#ffd200]",
    pill: "bg-[#002b5c] text-[#ffd200]",
  },
  "Brisbane Lions": {
    row: "bg-[#7c1f3a] text-[#fdb827]",
    pill: "bg-[#7c1f3a] text-[#fdb827]",
  },
  Carlton: {
    row: "bg-[#031a29] text-white",
    pill: "bg-[#031a29] text-white",
  },
  Collingwood: {
    row: "bg-black text-white",
    pill: "bg-black text-white",
  },
  Essendon: {
    row: "bg-black text-[#e41c23]",
    pill: "bg-black text-[#e41c23]",
  },
  Fremantle: {
    row: "bg-[#2a0f50] text-white",
    pill: "bg-[#2a0f50] text-white",
  },
  Geelong: {
    row: "bg-[#002b5c] text-white",
    pill: "bg-[#002b5c] text-white",
  },
  "Gold Coast": {
    row: "bg-[#d71920] text-[#ffd200]",
    pill: "bg-[#d71920] text-[#ffd200]",
  },
  GWS: {
    row: "bg-[#f15a22] text-white",
    pill: "bg-[#f15a22] text-white",
  },
  Hawthorn: {
    row: "bg-[#4a2b18] text-[#fdb827]",
    pill: "bg-[#4a2b18] text-[#fdb827]",
  },
  Melbourne: {
    row: "bg-[#0c2340] text-[#e41c23]",
    pill: "bg-[#0c2340] text-[#e41c23]",
  },
  "North Melbourne": {
    row: "bg-[#1f5fcb] text-white",
    pill: "bg-[#1f5fcb] text-white",
  },
  "Port Adelaide": {
    row: "bg-[#008aab] text-white",
    pill: "bg-[#008aab] text-white",
  },
  Richmond: {
    row: "bg-black text-[#ffd200]",
    pill: "bg-black text-[#ffd200]",
  },
  "St Kilda": {
    row: "bg-[#e41c23] text-white",
    pill: "bg-[#e41c23] text-white",
  },
  Sydney: {
    row: "bg-[#e41c23] text-white",
    pill: "bg-[#e41c23] text-white",
  },
  "West Coast": {
    row: "bg-[#003087] text-[#fdb827]",
    pill: "bg-[#003087] text-[#fdb827]",
  },
  "Western Bulldogs": {
    row: "bg-[#003087] text-[#e41c23]",
    pill: "bg-[#003087] text-[#e41c23]",
  },
};

const playerMap: Record<string, PlayerRecord> = Object.fromEntries(
  (players as PlayerRecord[]).map((player) => [player.id, player])
);

function getModeMeta(mode: StatMode) {
  return MODE_OPTIONS.find((option) => option.key === mode) ?? MODE_OPTIONS[0];
}

function getRangeMeta(range: LeaderboardRange) {
  return RANGE_OPTIONS.find((option) => option.key === range) ?? RANGE_OPTIONS[0];
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
  if (raw.includes("flex") || raw.includes("bench") || raw.includes("util"))
    return "FLEX";

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
  const normalized = normalizeClubName(club);
  return CLUB_LOGOS[normalized] ?? "";
}

function getPlayerModeScore(playerValue: string | null, mode: StatMode) {
  const record = getPlayerRecord(playerValue);
  if (!record) return null;

  const value = record[mode];
  if (typeof value !== "number") return 0;
  return value;
}

function normalizeClubName(club: string): string {
  if (!club) return "";

  if (club === "Brisbane") return "Brisbane Lions";
  if (club === "Fremantle Dockers") return "Fremantle";
  if (club === "Gold Coast Suns") return "Gold Coast";
  if (club === "GWS Giants") return "GWS";
  if (club === "West Coast Eagles") return "West Coast";
  if (club === "Sydney Swans") return "Sydney";

  return club;
}

function getClubTheme(club: string): ClubTheme {
  const normalized = normalizeClubName(club);

  return (
    CLUB_THEMES[normalized] ?? {
      row: "bg-[#173b76] border-[#4c73b3] text-white",
      pill: "bg-[#12305e] border-[#0d2447] text-white",
    }
  );
}

function DesktopBannerAd() {
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    holder.innerHTML = "";

    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.innerHTML = `
      atOptions = {
        'key' : '46f96e095682d833adea83e7b93f975a',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src =
      "https://www.highperformanceformat.com/46f96e095682d833adea83e7b93f975a/invoke.js";
    invokeScript.async = true;

    holder.appendChild(configScript);
    holder.appendChild(invokeScript);

    return () => {
      holder.innerHTML = "";
    };
  }, []);

  return (
    <div className="hidden md:block">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="mb-2 text-center text-[10px] font-extrabold tracking-[0.24em] text-white/40">
          SPONSORED
        </div>
        <div className="flex justify-center overflow-x-auto">
          <div ref={holderRef} className="min-h-[90px] min-w-[728px]" />
        </div>
      </div>
    </div>
  );
}

function MobileBannerAd() {
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    holder.innerHTML = "";

    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.innerHTML = `
      atOptions = {
        'key' : 'c84e7e3e20355404976b4853cf2b94ad',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src =
      "https://www.highperformanceformat.com/c84e7e3e20355404976b4853cf2b94ad/invoke.js";
    invokeScript.async = true;

    holder.appendChild(configScript);
    holder.appendChild(invokeScript);

    return () => {
      holder.innerHTML = "";
    };
  }, []);

  return (
    <div className="md:hidden">
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
        <div className="mb-2 text-center text-[10px] font-extrabold tracking-[0.24em] text-white/40">
          SPONSORED
        </div>
        <div className="flex justify-center">
          <div
            ref={holderRef}
            className="min-h-[50px] min-w-[320px] max-w-[320px]"
          />
        </div>
      </div>
    </div>
  );
}

function NativeBannerAd() {
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    holder.innerHTML = "";

    const invokeScript = document.createElement("script");
    invokeScript.async = true;
    invokeScript.setAttribute("data-cfasync", "false");
    invokeScript.src =
      "https://pl29221282.profitablecpmratenetwork.com/32115903d25f9a19c411cb00d051e98e/invoke.js";

    const container = document.createElement("div");
    container.id = "container-32115903d25f9a19c411cb00d051e98e";

    holder.appendChild(invokeScript);
    holder.appendChild(container);

    return () => {
      holder.innerHTML = "";
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,32,54,0.88),rgba(6,16,28,0.96))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold tracking-[0.24em] text-white/40">
            SPONSORED
          </div>
          <div className="mt-1 text-sm font-bold text-white/75 sm:text-base">
            Featured partner
          </div>
        </div>
      </div>

      <div
        ref={holderRef}
        className="min-h-[120px] overflow-hidden rounded-[18px] border border-white/8 bg-black/20"
      />
    </div>
  );
}

function SmartlinkCard() {
  return (
    <a
      href="https://www.profitablecpmratenetwork.com/y0erddngwm?key=af7b91235eff15104ab9c36820d723e8"
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[24px] border border-cyan-400/18 bg-[linear-gradient(135deg,rgba(20,35,58,0.95),rgba(8,18,30,0.98))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] transition hover:border-cyan-300/35 hover:bg-[linear-gradient(135deg,rgba(26,45,72,0.98),rgba(10,22,36,1))]"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold tracking-[0.24em] text-cyan-300/65">
            PARTNER LINK
          </div>
          <div className="mt-2 text-lg font-extrabold text-white sm:text-xl">
            Check out today’s featured offer
          </div>
          <div className="mt-1 text-sm font-semibold text-white/60">
            Opens in a new tab
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-extrabold tracking-[0.12em] text-cyan-200 transition group-hover:border-cyan-200/40 group-hover:bg-cyan-300/15">
          OPEN
        </div>
      </div>
    </a>
  );
}

function ModeDropdown({
  mode,
  setMode,
  disabled,
  sortedModes,
  modeCounts,
}: {
  mode: StatMode;
  setMode: (mode: StatMode) => void;
  disabled: boolean;
  sortedModes: ModeOption[];
  modeCounts: Partial<Record<StatMode, number>>;
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
          {sortedModes.map((option) => {
            const active = option.key === mode;
            const count = modeCounts[option.key] ?? 0;

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
                <div className="min-w-0">
                  <div className="truncate font-bold">{option.label}</div>
                  <div
                    className={`mt-0.5 text-[11px] font-extrabold tracking-[0.14em] ${
                      active ? "text-black/55" : "text-white/45"
                    }`}
                  >
                    {count} ENTRIES
                  </div>
                </div>

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

function RangeTabs({
  range,
  setRange,
  disabled,
}: {
  range: LeaderboardRange;
  setRange: (range: LeaderboardRange) => void;
  disabled: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
      {RANGE_OPTIONS.map((option) => {
        const active = option.key === range;

        return (
          <button
            key={option.key}
            type="button"
            disabled={disabled}
            onClick={() => setRange(option.key)}
            className={`min-w-[120px] rounded-2xl px-4 py-3 text-sm font-extrabold tracking-[0.08em] transition sm:min-w-[140px] ${
              active
                ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
                : disabled
                  ? "cursor-not-allowed bg-white/[0.04] text-white/35"
                  : "bg-white/[0.04] text-white/75 hover:bg-white/[0.10] hover:text-white"
            }`}
          >
            {option.label.toUpperCase()}
          </button>
        );
      })}
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
              Score:{" "}
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
            {teamEntries.map(([slot, player]) => {
              const slotLabel = normalizeSlot(slot);
              const displayName = getPlayerDisplayName(player);
              const club = getPlayerClub(player);
              const logo = getPlayerLogo(player);
              const playerScore = getPlayerModeScore(player, mode);
              const theme = getClubTheme(club);

              return (
                <div
                  key={slot}
                  className="grid grid-cols-[82px_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[94px_minmax(0,1fr)]"
                >
                  <div className="flex min-h-[58px] items-center justify-center rounded-2xl bg-[#efbe00] px-2 text-center text-lg font-black tracking-[0.04em] text-black shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)] sm:min-h-[62px]">
                    {slotLabel}
                  </div>

                  <div
                    className={`flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border px-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)] sm:min-h-[62px] sm:px-6 ${theme.row}`}
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
                          <div className="truncate text-xs font-bold opacity-90 sm:text-sm">
                            {club}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={`shrink-0 rounded-2xl border px-3 py-2 text-sm font-black tracking-[0.05em] sm:px-4 sm:text-base ${theme.pill}`}
                    >
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

function SideBannerAd() {
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    holder.innerHTML = "";

    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.innerHTML = `
      atOptions = {
        'key' : 'a6aad23e6f405117e2d6001cafd75afe',
        'format' : 'iframe',
        'height' : 600,
        'width' : 160,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src =
      "https://www.highperformanceformat.com/a6aad23e6f405117e2d6001cafd75afe/invoke.js";
    invokeScript.async = true;

    holder.appendChild(configScript);
    holder.appendChild(invokeScript);

    return () => {
      holder.innerHTML = "";
    };
  }, []);

  return (
    <div className="hidden xl:block shrink-0">
      <div className="sticky top-24">
        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black/30 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="mb-1 text-center text-[9px] font-extrabold tracking-[0.2em] text-white/40">
            AD
          </div>
          <div ref={holderRef} className="h-[600px] w-[160px]" />
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<StatMode>("sc_points");
  const [range, setRange] = useState<LeaderboardRange>("all_time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [topScore, setTopScore] = useState(0);
  const [topName, setTopName] = useState("—");
  const [totalEntries, setTotalEntries] = useState(0);
  const [modeCounts, setModeCounts] = useState<
    Partial<Record<StatMode, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(
    null
  );

  const modeMeta = useMemo(() => getModeMeta(mode), [mode]);
  const rangeMeta = useMemo(() => getRangeMeta(range), [range]);

  const sortedModes = useMemo(() => {
    return [...MODE_OPTIONS].sort((a, b) => {
      const countA = modeCounts[a.key] ?? 0;
      const countB = modeCounts[b.key] ?? 0;

      if (countB !== countA) return countB - countA;

      const selectedBoostA = a.key === mode ? 1 : 0;
      const selectedBoostB = b.key === mode ? 1 : 0;
      if (selectedBoostB !== selectedBoostA)
        return selectedBoostB - selectedBoostA;

      return a.label.localeCompare(b.label);
    });
  }, [modeCounts, mode]);

  async function fetchLeaderboard(
    modeToLoad: StatMode,
    rangeToLoad: LeaderboardRange
  ) {
    const res = await fetch(
      `/api/ranked/top?mode=${encodeURIComponent(modeToLoad)}&period=${encodeURIComponent(rangeToLoad)}`,
      { cache: "no-store" }
    );

    const data: LeaderboardResponse & { error?: string } = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to load leaderboard.");
    }

    return data;
  }

  async function loadLeaderboard(
    selectedMode: StatMode,
    selectedRange: LeaderboardRange
  ) {
    try {
      setLoading(true);
      setError("");

      const [selectedData, ...otherModeData] = await Promise.all([
        fetchLeaderboard(selectedMode, selectedRange),
        ...MODE_OPTIONS.filter((option) => option.key !== selectedMode).map(
          (option) =>
            fetchLeaderboard(option.key, selectedRange)
              .then((data) => ({
                mode: option.key,
                totalEntries: Number(data?.totalEntries ?? 0) || 0,
              }))
              .catch(() => ({
                mode: option.key,
                totalEntries: 0,
              }))
        ),
      ]);

      setEntries(Array.isArray(selectedData?.entries) ? selectedData.entries : []);
      setTopScore(Number(selectedData?.topScore ?? 0) || 0);
      setTopName(
        typeof selectedData?.topName === "string" ? selectedData.topName : "—"
      );
      setTotalEntries(Number(selectedData?.totalEntries ?? 0) || 0);

      const nextCounts: Partial<Record<StatMode, number>> = {
        [selectedMode]: Number(selectedData?.totalEntries ?? 0) || 0,
      };

      for (const item of otherModeData) {
        nextCounts[item.mode] = item.totalEntries;
      }

      setModeCounts(nextCounts);
    } catch (err) {
      setEntries([]);
      setTopScore(0);
      setTopName("—");
      setTotalEntries(0);
      setModeCounts({});
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard."
      );
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

      const savedRange = localStorage.getItem("leaderboard_selected_range_2026");
      if (
        savedRange &&
        RANGE_OPTIONS.some((option) => option.key === savedRange)
      ) {
        setRange(savedRange as LeaderboardRange);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("leaderboard_selected_mode_2026", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem("leaderboard_selected_range_2026", range);
    } catch {}
  }, [range]);

  useEffect(() => {
    loadLeaderboard(mode, range);
  }, [mode, range]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <Script
        id="leaderboard-popunder"
        strategy="afterInteractive"
        src="https://pl29221280.profitablecpmratenetwork.com/dd/3f/e2/dd3fe214e5d4ca795209f0ea035a483f.js"
      />

      <div className="pointer-events-none absolute inset-0 bg-black/45" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] gap-6 px-3 py-5 sm:px-6 sm:py-10">
        <div className="min-w-0 flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-[0.08em] text-white sm:text-4xl">
              {rangeMeta.label.toUpperCase()} LEADERBOARD
            </h1>
            <div className="mt-2 text-sm font-semibold text-white/70 sm:text-base">
              Ranked runs across every stat mode
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <RangeTabs range={range} setRange={setRange} disabled={loading} />
          </div>

          <div className="mt-5 flex justify-center sm:mt-6">
            <ModeDropdown
              mode={mode}
              setMode={setMode}
              disabled={loading}
              sortedModes={sortedModes}
              modeCounts={modeCounts}
            />
          </div>

          <div className="mt-6">
            <DesktopBannerAd />
            <MobileBannerAd />
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
              <div className="mt-3 flex flex-wrap items-end gap-2">
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

          <div className="mt-6 sm:mt-8">
            <NativeBannerAd />
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
                <div className="text-lg font-extrabold text-red-300">
                  Could not load leaderboard
                </div>
                <div className="mt-2 text-sm font-semibold text-white/65">
                  {error}
                </div>
              </div>
            ) : loading ? (
              <div className="px-4 py-4 sm:px-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[58px] animate-pulse border-b border-[#253047] bg-white/[0.03]"
                  />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="px-4 py-12 text-center sm:px-6">
                <div className="text-xl font-extrabold text-white">
                  No scores yet
                </div>
                <div className="mt-2 text-sm font-semibold text-white/60">
                  Be the first to submit a {rangeMeta.label.toLowerCase()} ranked
                  score in {modeMeta.label}.
                </div>
              </div>
            ) : (
              <div>
                {entries.map((entry) => (
                  <div
                    key={`${entry.id ?? entry.name}-${entry.rank}-${entry.score}`}
                    className="grid grid-cols-[72px_minmax(0,1fr)_90px_110px] items-center gap-2 border-b border-[#253047] px-4 py-4 transition hover:bg-white/[0.03] sm:grid-cols-[100px_minmax(0,1fr)_160px_140px] sm:px-6"
                  >
                    <div
                      className={`text-xl font-extrabold ${rankColor(entry.rank)}`}
                    >
                      {entry.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-base font-extrabold text-white sm:text-xl">
                        {entry.name}
                      </div>
                    </div>

                    <div
                      className={`text-base font-extrabold sm:text-xl ${scoreColor(entry.rank)}`}
                    >
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

          <div className="mt-6 sm:mt-8">
            <SmartlinkCard />
          </div>
        </div>

        <SideBannerAd />
      </div>

      <TeamModal
        entry={selectedEntry}
        mode={mode}
        onClose={() => setSelectedEntry(null)}
      />
    </main>
  );
}