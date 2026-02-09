import { useEffect, type ReactNode } from "react";
import { ThemeContext, type Theme, type FontSize } from "./themeContextValue";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type { Theme, FontSize };

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "12px",
  medium: "18px",
  large: "25px",
};

const VALID_THEMES: readonly string[] = ["light", "dark"];
const VALID_FONT_SIZES: readonly string[] = ["small", "medium", "large"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>(
    STORAGE_KEYS.THEME,
    "light",
    {
      serialize: (v) => v,
      deserialize: (raw) =>
        VALID_THEMES.includes(raw) ? (raw as Theme) : "light",
    },
  );

  const [fontSize, setFontSize] = useLocalStorage<FontSize>(
    STORAGE_KEYS.FONT_SIZE,
    "medium",
    {
      serialize: (v) => v,
      deserialize: (raw) =>
        VALID_FONT_SIZES.includes(raw) ? (raw as FontSize) : "medium",
    },
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size-base",
      FONT_SIZE_MAP[fontSize],
    );
  }, [fontSize]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider
      value={{ theme, fontSize, toggleTheme, setFontSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
