"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => (typeof document === "undefined" ? false : document.documentElement.classList.contains("dark")));
  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
    setDark(!dark);
  };
  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="تغییر قالب">{dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</button>;
}
