import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme-preference";
const ORDER: ThemePreference[] = ["system", "light", "dark"];

const ICONS: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<ThemePreference, string> = {
  system: "Matching your system",
  light: "Light",
  dark: "Dark",
};

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // Storage unavailable — fall back to system.
  }
  return "system";
}

function apply(preference: ThemePreference) {
  if (preference === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", preference);
  }
}

/**
 * A three-state cycle (system → light → dark → system) rather than a plain
 * on/off switch, so choosing light or dark is always a deliberate override
 * of the OS setting, and there's always a one-click way back to it. The
 * inline script in index.html applies whatever was last stored before this
 * component — or React — ever mounts, so there's no flash of the wrong
 * appearance on load.
 */
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(readStored);

  useEffect(() => {
    apply(preference);
    try {
      if (preference === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Preference just won't persist across a reload; still applies now.
    }
  }, [preference]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
    setPreference(next);
  }

  const Icon = ICONS[preference];

  return (
    <button
      type="button"
      onClick={cycle}
      data-tour="theme-toggle"
      aria-label={`Appearance: ${LABELS[preference]}. Click to change.`}
      title={`Appearance: ${LABELS[preference]}`}
      className="interactive fixed right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg hover:border-primary/40 hover:text-foreground"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
