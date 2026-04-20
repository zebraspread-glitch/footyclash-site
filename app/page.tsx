import Link from "next/link";
import { User, Users, Bot, Globe } from "lucide-react";

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
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-transparent overflow-hidden text-white">
  {/* GLOBAL OVERLAY (keeps text readable on image mode) */}
  <div className="pointer-events-none absolute inset-0 bg-black/60" />

  {/* CONTENT */}
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
                  {/* subtle shine */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/15 to-transparent" />
                  </div>

                  <div className="relative z-10 flex h-full flex-col">
                    <div>
                      <div className="mb-8">
                        <Icon
                          size={40}
                          strokeWidth={2.2}
                          className={`${styles.icon} transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-1`}
                        />
                      </div>

                      <h2 className="text-3xl font-black italic tracking-tight text-white transition-transform duration-300 group-hover:-translate-y-1">
                        {mode.title}
                      </h2>
                    </div>

                    <div className="mt-auto">
                      <div
                        className={`text-base font-black tracking-[0.12em] transition-all duration-300 group-hover:translate-y-[-4px] ${styles.text}`}
                      >
                        {mode.button}
                      </div>

                      <div className="grid transition-all duration-400 ease-out [grid-template-rows:0fr] group-hover:mt-5 group-hover:[grid-template-rows:1fr]">
                        <div className="overflow-hidden">
                          <p className="translate-y-3 opacity-0 text-base leading-7 text-white/80 transition-all duration-300 delay-75 group-hover:translate-y-0 group-hover:opacity-100">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}