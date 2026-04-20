"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-to-play", label: "How to Play" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

type Mode = "solo" | "local" | "ai" | "online" | "home";

const modeColors: Record<Mode, string> = {
  home: "bg-[#05070b]",
  solo: "bg-blue-600",
  local: "bg-purple-600",
  ai: "bg-orange-500",
  online: "bg-green-600",
};

export default function TopBar() {
  const pathname = usePathname();

  let mode: Mode = "home";

  if (pathname === "/") mode = "home";
  else if (pathname.startsWith("/solo")) mode = "solo";
  else if (pathname.startsWith("/local")) mode = "local";
  else if (pathname.startsWith("/ai")) mode = "ai";
  else if (pathname.startsWith("/online")) mode = "online";
  else mode = "home";

  const bgColor = modeColors[mode];

  return (
    <header
      className={`${bgColor} border-b border-black/20 shadow-lg transition-colors duration-300`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        
        {/* LEFT SIDE (LOGO) */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group lg:gap-4">
            <div className="relative h-11 w-11 flex-shrink-0 transition group-hover:scale-110 sm:h-14 sm:w-14">
              <Image
                src="/topbaricon.png"
                alt="FootyClash Logo"
                fill
                className="object-cover scale-125 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                priority
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="text-xl font-black tracking-tight text-white sm:text-2xl">
                FootyClash
              </div>
              <div className="text-[11px] text-white/80 sm:text-[12px]"></div>
            </div>
          </Link>

          {/* SETTINGS BUTTON (mobile right side) */}
          <Link
            href="/settings"
            className="ml-auto rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white text-sm transition hover:bg-white/20 active:scale-95 lg:hidden"
          >
            ⚙️
          </Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-between gap-2">
          
          {/* NAV */}
          <nav className="flex flex-wrap gap-2 text-xs font-semibold sm:text-sm lg:flex-nowrap">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white transition hover:bg-white/20 active:scale-95 sm:px-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* SETTINGS BUTTON (desktop right side) */}
          <Link
            href="/settings"
            className="hidden lg:flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white text-sm transition hover:bg-white/20 active:scale-95"
          >
            ⚙️
          </Link>
        </div>
      </div>
    </header>
  );
}