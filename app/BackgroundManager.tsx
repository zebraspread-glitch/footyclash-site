"use client";

import { useEffect } from "react";

type Background = "dark" | "light" | "image";

export default function BackgroundManager() {
  useEffect(() => {
    const applyBackground = () => {
      const saved = (localStorage.getItem("background") as Background | null) || "dark";

      const body = document.body;

      body.style.background = "";
      body.style.backgroundColor = "";
      body.style.backgroundImage = "";
      body.style.backgroundSize = "";
      body.style.backgroundPosition = "";
      body.style.backgroundRepeat = "";
      body.style.backgroundAttachment = "";
      body.style.color = "";

      if (saved === "dark") {
        body.style.background = "#05070b";
        body.style.color = "white";
      } else if (saved === "light") {
        body.style.background = "#f5f5f5";
        body.style.color = "black";
      } else if (saved === "image") {
        body.style.background = "url('/background.png') center/cover no-repeat fixed";
        body.style.color = "white";
      }
    };

    applyBackground();

    window.addEventListener("storage", applyBackground);

    return () => {
      window.removeEventListener("storage", applyBackground);
    };
  }, []);

  return null;
}