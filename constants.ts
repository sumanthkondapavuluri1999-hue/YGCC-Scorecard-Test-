import { Picker, ThemeConfig, ThemeId } from './types';

// PASTE YOUR BASE64 IMAGE STRING INSIDE THE QUOTES BELOW TO MANUALLY UPLOAD IN CODE
export const MANUAL_LOGO_BASE64 = ""; 

export const THEMES: Record<ThemeId, ThemeConfig> = {
  yg: {
    id: 'yg',
    label: 'Young Guns Industrial',
    font: 'font-sans',
    styles: {
      background: 'bg-zinc-950',
      container: 'bg-zinc-900 border-t-8 border-yg-orange shadow-2xl shadow-black',
      textMain: 'text-white',
      textRow: 'text-white',
      textHeader: 'text-yg-orange uppercase tracking-widest',
      accent: 'bg-green-500/20 text-green-400 border border-green-500/50',
      danger: 'bg-red-500/20 text-red-400 border border-red-500/50',
      rowOdd: 'bg-zinc-800/40',
      rowEven: 'bg-zinc-800/20',
      border: 'border-zinc-700',
      targetBox: 'bg-blue-600/20 text-blue-100 border-2 border-blue-500', 
    },
    headers: {
      operator: 'Operator',
      hoursPrefix: 'H',
      total: 'Total Units',
      target: 'KPI Target',
    },
  },
  v8: {
    id: 'v8',
    label: 'V8 Supercars',
    font: 'font-sans italic font-bold tracking-tight', // Changed from font-racing to readable sans-serif
    styles: {
      background: 'bg-slate-950',
      container: 'bg-slate-900 border-x-4 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.3)]',
      textMain: 'text-white',
      textRow: 'text-white',
      textHeader: 'text-cyan-400 uppercase italic',
      accent: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400',
      danger: 'bg-red-600/20 text-red-300 border border-red-500',
      rowOdd: 'bg-slate-800/60',
      rowEven: 'bg-slate-900/60',
      border: 'border-slate-700',
      targetBox: 'bg-red-600 text-white border-2 border-white italic transform -skew-x-12 shadow-[0_0_10px_rgba(220,38,38,0.8)]',
    },
    headers: {
      operator: 'Driver',
      hoursPrefix: 'Lap',
      total: 'Speed (KM/H)',
      target: 'Pole Pos',
    },
  },
  nrl: {
    id: 'nrl',
    label: 'NRL League',
    font: 'font-blocky',
    styles: {
      background: 'bg-green-950',
      container: 'bg-green-900 border-4 border-yellow-400 shadow-2xl',
      textMain: 'text-white',
      textRow: 'text-white',
      textHeader: 'text-yellow-400 uppercase tracking-tight',
      accent: 'bg-yellow-400 text-green-900 border border-yellow-600 font-bold',
      danger: 'bg-red-800/60 text-white border border-red-500',
      rowOdd: 'bg-green-800/40',
      rowEven: 'bg-green-800/20',
      border: 'border-green-700',
      targetBox: 'bg-white text-green-900 border-2 border-green-500 font-black',
    },
    headers: {
      operator: 'The Lineup',
      hoursPrefix: 'R',
      total: 'Run Metres',
      target: 'Try Line',
    },
  },
  arcade: {
    id: 'arcade',
    label: 'Retro Arcade',
    font: 'font-arcade text-xs md:text-sm',
    styles: {
      background: 'bg-purple-950',
      container: 'bg-black border-4 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.6)]',
      textMain: 'text-pink-100',
      textRow: 'text-pink-100',
      textHeader: 'text-lime-400',
      accent: 'bg-lime-500 text-black border border-lime-400',
      danger: 'bg-red-600 text-white border border-red-500',
      rowOdd: 'bg-purple-900/30',
      rowEven: 'bg-purple-900/10',
      border: 'border-pink-500/30',
      targetBox: 'bg-cyan-500 text-black border-2 border-white animate-pulse',
    },
    headers: {
      operator: 'Player 1',
      hoursPrefix: 'Lvl',
      total: 'High Score',
      target: 'Boss HP',
    },
  },
  cricket: {
    id: 'cricket',
    label: 'Cricket Test Match',
    font: 'font-sans',
    styles: {
      background: 'bg-emerald-950', // Dark Green Background
      container: 'bg-white text-emerald-950 border-t-8 border-emerald-800 shadow-xl',
      textMain: 'text-white', // Main Site Header text (on Dark BG)
      textRow: 'text-emerald-900', // Row text (on White BG)
      textHeader: 'text-emerald-800 uppercase border-b-2 border-emerald-800',
      accent: 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold',
      danger: 'bg-red-50 text-red-900 border border-red-200 font-bold',
      rowOdd: 'bg-gray-100',
      rowEven: 'bg-white',
      border: 'border-gray-300',
      targetBox: 'bg-red-800 text-white border-2 border-red-900 rounded-full px-4',
    },
    headers: {
      operator: 'Batter',
      hoursPrefix: 'Ov',
      total: 'Total Runs',
      target: 'Target',
    },
  },
};

export const INITIAL_DATA: Picker[] = [
  { id: '1', name: 'John Smith', hours: [45, 50, 48, 55, 60, 40, 50, 55, 60, 65], total: 528, target: 500 },
  { id: '2', name: 'Sarah Connor', hours: [60, 65, 70, 75, 80, 70, 75, 80, 85, 90], total: 750, target: 600 },
  { id: '3', name: 'Max Rockatansky', hours: [30, 35, 40, 30, 35, 40, 45, 30, 35, 40], total: 360, target: 500 },
  { id: '4', name: 'Ellen Ripley', hours: [55, 58, 60, 62, 65, 60, 62, 65, 68, 70], total: 625, target: 600 },
  { id: '5', name: 'Tony Stark', hours: [80, 85, 90, 85, 90, 95, 100, 90, 85, 90], total: 890, target: 800 },
];