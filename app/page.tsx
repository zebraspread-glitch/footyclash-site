import Link from "next/link";
import Image from "next/image";
import {
  User,
  Users,
  Bot,
  Globe,
  Trophy,
  BarChart3,
  CalendarDays,
} from "lucide-react";

const modes = [
  {
    href: "/solo",
    title: "SOLO",
    description: "Play by yourself and chase your best score.",
    button: "PLAY SOLO →",
    color: "blue",
    icon: User,
  },
  {
    href: "/local",
    title: "LOCAL",
    description: "Play 1v1 with a friend on the same device.",
    button: "PLAY LOCAL →",
    color: "purple",
    icon: Users,
  },
  {
    href: "/ai",
    title: "AI",
    description: "Take on the computer in a draft battle.",
    button: "PLAY AI →",
    color: "orange",
    icon: Bot,
  },
  {
    href: "/online",
    title: "ONLINE",
    description: "Play against other people in live matches.",
    button: "PLAY ONLINE →",
    color: "green",
    icon: Globe,
  },
];

const middleModes = [
  {
    href: "/daily",
    title: "DAILY MODE",
    description: "Play the daily challenge and compare your result to the best possible team.",
    button: "PLAY DAILY →",
    color: "indigo",
    icon: CalendarDays,
  },
  {
    href: "/ranked",
    title: "RANKED MODE",
    description: "Try and get higher than Cody Welch on the leaderboard.",
    button: "PLAY RANKED →",
    color: "cyan",
    icon: Trophy,
  },
  {
    href: "/leaderboard",
    title: "LEADERBOARD",
    description: "See the top players and compare your performance.",
    button: "VIEW LEADERBOARD →",
    color: "pink",
    icon: BarChart3,
  },
];

const extraModes = [
  {
    href: "https://footywho.com",
    title: "FOOTYWHO",
    description: "Guess the AFL player in this Wordle-style game.",
    button: "PLAY FOOTYWHO →",
    color: "white",
    image: "/footywho.png",
  },
  {
    href: "https://footyarcade.com",
    title: "FOOTYARCADE",
    description: "Play a collection of AFL mini-games.",
    button: "VISIT ARCADE →",
    color: "red",
    image: "/footyarcade.png",
  },
];

const colorStyles: Record<
  string,
  {
    bg: string;
    border: string;
    icon: string;
    text: string;
    glow: string;
  }
> = {
  blue: {
    bg: "bg-blue-600",
    border: "hover:border-blue-300",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(37,99,235,0.35)]",
  },
  purple: {
    bg: "bg-purple-600",
    border: "hover:border-purple-300",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(147,51,234,0.35)]",
  },
  orange: {
    bg: "bg-orange-500",
    border: "hover:border-orange-200",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(249,115,22,0.35)]",
  },
  green: {
    bg: "bg-green-600",
    border: "hover:border-green-300",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(22,163,74,0.35)]",
  },
  red: {
    bg: "bg-red-600",
    border: "hover:border-red-300",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(220,38,38,0.35)]",
  },
  yellow: {
    bg: "bg-yellow-500",
    border: "hover:border-yellow-200",
    icon: "text-black",
    text: "text-black",
    glow: "group-hover:shadow-[0_20px_60px_rgba(234,179,8,0.35)]",
  },
  cyan: {
    bg: "bg-yellow-400",
    border: "hover:border-cyan-200",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(6,182,212,0.35)]",
  },
  pink: {
    bg: "bg-yellow-600",
    border: "hover:border-pink-300",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(219,39,119,0.35)]",
  },
  indigo: {
    bg: "bg-indigo-600",
    border: "hover:border-indigo-300",
    icon: "text-white",
    text: "text-white",
    glow: "group-hover:shadow-[0_20px_60px_rgba(79,70,229,0.35)]",
  },
  white: {
    bg: "bg-white",
    border: "hover:border-gray-300",
    icon: "text-black",
    text: "text-black",
    glow: "group-hover:shadow-[0_20px_60px_rgba(255,255,255,0.25)]",
  },
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              FootyClash
            </h1>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Pick a mode and start playing.
            </p>
          </div>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {modes.map((mode) => {
              const styles = colorStyles[mode.color];
              const Icon = mode.icon;

              return (
                <Link
                  key={mode.title}
                  href={mode.href}
                  className={`group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 ${styles.bg} p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:border-white/20 ${styles.border} ${styles.glow}`}
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100" />

                  <div className="flex h-full flex-col">
                    <div>
                      <Icon className={`${styles.icon} mb-8`} size={40} />
                      <h2 className="text-3xl font-black italic">{mode.title}</h2>
                    </div>

                    <div className="mt-auto">
                      <div className={`font-black ${styles.text}`}>
                        {mode.button}
                      </div>
                      <p className="mt-4 text-white/80">{mode.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {middleModes.map((mode) => {
              const styles = colorStyles[mode.color];
              const Icon = mode.icon;

              return (
                <Link
                  key={mode.title}
                  href={mode.href}
                  className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 ${styles.bg} p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:border-white/20 ${styles.border} ${styles.glow}`}
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100" />

                  <div className="flex h-full flex-col">
                    <div>
                      <Icon className={`${styles.icon} mb-6`} size={40} />
                      <h2 className="text-3xl font-black italic">{mode.title}</h2>
                    </div>

                    <div className="mt-auto">
                      <div className={`font-black ${styles.text}`}>
                        {mode.button}
                      </div>
                      <p className="mt-4 text-white/80">{mode.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
            {extraModes.map((mode) => {
              const styles = colorStyles[mode.color];

              return (
                <a
                  key={mode.title}
                  href={mode.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 ${styles.bg} p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] ${styles.glow}`}
                >
                  <div className="flex h-full flex-col">
                    <div>
                      <Image
                        src={mode.image}
                        alt={mode.title}
                        width={64}
                        height={64}
                        className={`mb-6 object-contain drop-shadow-lg ${
                          mode.title === "FOOTYARCADE"
                            ? "scale-125"
                            : "scale-100"
                        }`}
                      />
                      <h2 className="text-2xl font-black italic">{mode.title}</h2>
                    </div>

                    <div className="mt-auto">
                      <div className={`font-black ${styles.text}`}>
                        {mode.button}
                      </div>
                      <p
                        className={`mt-3 ${
                          mode.color === "yellow" ? "text-black/80" : "text-white/80"
                        }`}
                      >
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}