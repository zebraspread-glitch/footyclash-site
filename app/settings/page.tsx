"use client";

import { useEffect, useState } from "react";

type Background = "dark" | "light" | "image";

export default function SettingsPage() {
  const [bg, setBg] = useState<Background>("dark");

  // Load saved setting
  useEffect(() => {
    const saved = localStorage.getItem("background") as Background | null;
    if (saved) setBg(saved);
  }, []);

  // Apply + save setting
  useEffect(() => {
    localStorage.setItem("background", bg);

    const body = document.body;

    // reset
    body.classList.remove("bg-dark", "bg-light", "bg-image");

    if (bg === "dark") {
      body.style.background = "#05070b";
    } else if (bg === "light") {
      body.style.background = "#f5f5f5";
    } else if (bg === "image") {
      body.style.background = "url('/background.png') center/cover no-repeat fixed";
    }
  }, [bg]);

  return (
    <main className="min-h-screen text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Background</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setBg("dark")}
              className={`px-4 py-2 rounded-lg border ${
                bg === "dark"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white border-white/20"
              }`}
            >
              Dark
            </button>

            <button
              onClick={() => setBg("light")}
              className={`px-4 py-2 rounded-lg border ${
                bg === "light"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white border-white/20"
              }`}
            >
              Light
            </button>

            <button
              onClick={() => setBg("image")}
              className={`px-4 py-2 rounded-lg border ${
                bg === "image"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white border-white/20"
              }`}
            >
              Image
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}