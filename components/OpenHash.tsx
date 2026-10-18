"use client";
import { useEffect } from "react";
export default function OpenHash() {
  useEffect(() => {
    const go = () => { const el = document.getElementById(location.hash.slice(1)); if (el instanceof HTMLDetailsElement) { el.open = true; el.scrollIntoView({ block: "center", behavior: "smooth" }); } };
    go(); window.addEventListener("hashchange", go); return () => window.removeEventListener("hashchange", go);
  }, []);
  return null;
}
