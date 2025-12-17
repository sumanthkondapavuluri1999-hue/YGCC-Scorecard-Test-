export interface Picker {
  id: string;
  name: string;
  hours: number[]; // Array of 10 numbers
  total: number;
  target: number;
}

export type ThemeId = 'yg' | 'v8' | 'nrl' | 'arcade' | 'cricket';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  font: string; // Tailwind font class
  styles: {
    background: string; // CSS background
    container: string; // Tailwind classes for the main container
    textMain: string; // Used for Page Headers (Site Name)
    textRow: string; // Used for Data Rows (Contestant Name)
    textHeader: string; // Used for Table Headers
    accent: string; // For high performance
    danger: string; // For low performance
    rowOdd: string;
    rowEven: string;
    border: string;
    targetBox: string; // New: Specific style for the Target Column
  };
  headers: {
    operator: string;
    hoursPrefix: string; // e.g., "H", "Lvl", "Lap"
    total: string;
    target: string;
  };
}