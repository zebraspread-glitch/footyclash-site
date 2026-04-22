"use client";

import { useEffect } from "react";

export default function SideBanner160() {
  useEffect(() => {
    try {
      // @ts-ignore
      window.atOptions = {
        key: "a6aad23e6f405117e2d6001cafd75afe",
        format: "iframe",
        height: 600,
        width: 160,
        params: {},
      };

      const script = document.createElement("script");
      script.src =
        "https://www.highperformanceformat.com/a6aad23e6f405117e2d6001cafd75afe/invoke.js";
      script.async = true;

      document.getElementById("side-banner-container")?.appendChild(script);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div
      id="side-banner-container"
      className="w-[160px] h-[600px]"
    />
  );
}