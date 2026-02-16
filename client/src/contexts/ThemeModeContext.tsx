import React, { createContext, useContext } from 'react';
import { ThemeMode } from '../theme';

interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

export const ThemeModeProvider: React.FC<{ mode: ThemeMode; toggleMode: () => void; children: React.ReactNode }>
  = ({ mode, toggleMode, children }) => {
    return (
      <ThemeModeContext.Provider value={{ mode, toggleMode }}>
        {children}
      </ThemeModeContext.Provider>
    );
  };

export const useThemeMode = (): ThemeModeContextValue => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
};


