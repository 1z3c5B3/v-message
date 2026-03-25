import { useState, useEffect } from 'react';

export interface Theme {
  name: string;
  colors: {
    bg: string;
    bg2: string;
    bg3: string;
    surface: string;
    surface2: string;
    border: string;
    accent: string;
    accentHover: string;
    accentLight: string;
    text: string;
    text2: string;
    text3: string;
    bubbleMine: string;
    bubbleTheirs: string;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'Default',
    colors: {
      bg: '#0e1117',
      bg2: '#161b22',
      bg3: '#1c2128',
      surface: '#21262d',
      surface2: '#2d333b',
      border: '#30363d',
      accent: '#6e5ce6',
      accentHover: '#8171f0',
      accentLight: 'rgba(110,92,230,0.15)',
      text: '#e6edf3',
      text2: '#8b949e',
      text3: '#484f58',
      bubbleMine: '#6e5ce6',
      bubbleTheirs: '#21262d',
    },
  },
  blue: {
    name: 'Ocean Blue',
    colors: {
      bg: '#0a1628',
      bg2: '#0f1f3d',
      bg3: '#1a2f4d',
      surface: '#244061',
      surface2: '#2f4f75',
      border: '#3a5f85',
      accent: '#4a9eff',
      accentHover: '#6eb3ff',
      accentLight: 'rgba(74,158,255,0.15)',
      text: '#e6f3ff',
      text2: '#8fb3d9',
      text3: '#4d7299',
      bubbleMine: '#4a9eff',
      bubbleTheirs: '#1a2f4d',
    },
  },
  green: {
    name: 'Forest Green',
    colors: {
      bg: '#0a1a0f',
      bg2: '#0f2817',
      bg3: '#1a3522',
      surface: '#244530',
      surface2: '#2f573d',
      border: '#3a6a4a',
      accent: '#4ade80',
      accentHover: '#6ee79a',
      accentLight: 'rgba(74,222,128,0.15)',
      text: '#e6ffec',
      text2: '#8fd9a8',
      text3: '#4da872',
      bubbleMine: '#4ade80',
      bubbleTheirs: '#1a3522',
    },
  },
  red: {
    name: 'Crimson Red',
    colors: {
      bg: '#1a0a0f',
      bg2: '#280f17',
      bg3: '#351a22',
      surface: '#452430',
      surface2: '#572f3d',
      border: '#6a3a4a',
      accent: '#f87171',
      accentHover: '#fca5a5',
      accentLight: 'rgba(248,113,113,0.15)',
      text: '#ffe6e6',
      text2: '#d98f8f',
      text3: '#a84d4d',
      bubbleMine: '#f87171',
      bubbleTheirs: '#351a22',
    },
  },
  light: {
    name: 'Light Mode',
    colors: {
      bg: '#f5f5f5',
      bg2: '#ffffff',
      bg3: '#e8e8e8',
      surface: '#d9d9d9',
      surface2: '#c9c9c9',
      border: '#bfbfbf',
      accent: '#6e5ce6',
      accentHover: '#8171f0',
      accentLight: 'rgba(110,92,230,0.15)',
      text: '#1a1a1a',
      text2: '#4a4a4a',
      text3: '#7a7a7a',
      bubbleMine: '#6e5ce6',
      bubbleTheirs: '#ffffff',
    },
  },
};

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved && themes[saved]) {
      setCurrentTheme(saved);
      applyTheme(themes[saved]);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.colors.bg);
    root.style.setProperty('--bg2', theme.colors.bg2);
    root.style.setProperty('--bg3', theme.colors.bg3);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--surface2', theme.colors.surface2);
    root.style.setProperty('--border', theme.colors.border);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-hover', theme.colors.accentHover);
    root.style.setProperty('--accent-light', theme.colors.accentLight);
    root.style.setProperty('--text', theme.colors.text);
    root.style.setProperty('--text2', theme.colors.text2);
    root.style.setProperty('--text3', theme.colors.text3);
    root.style.setProperty('--bubble-mine', theme.colors.bubbleMine);
    root.style.setProperty('--bubble-theirs', theme.colors.bubbleTheirs);
  };

  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('theme', themeName);
      applyTheme(themes[themeName]);
    }
  };

  return { currentTheme, setTheme, themes };
}
