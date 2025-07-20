import type { ColorPalette } from '../types';
import { ColorTheme } from '../types';

export const COLOR_THEMES: Record<ColorTheme, ColorPalette> = {
  [ColorTheme.NEON]: {
    primary: [
      '#00ffff', // Cyan
      '#ff00ff', // Magenta
      '#00ff00', // Lime
      '#ffff00', // Yellow
      '#ff0080', // Pink
      '#8000ff', // Purple
    ],
    secondary: [
      '#0080ff', // Blue
      '#ff8000', // Orange
      '#80ff00', // Light green
      '#ff0040', // Red-pink
    ],
    background: '#000010',
    accent: '#ffffff',
  },

  [ColorTheme.SUNSET]: {
    primary: [
      '#ff6b35', // Orange-red
      '#f7931e', // Orange
      '#ffd23f', // Yellow
      '#ff4757', // Red
      '#ff6b9d', // Pink
      '#ff9f43', // Light orange
    ],
    secondary: [
      '#ff7675', // Light red
      '#fdcb6e', // Light yellow
      '#e17055', // Brown-orange
      '#fd79a8', // Light pink
    ],
    background: '#2d1b69',
    accent: '#fff200',
  },

  [ColorTheme.MONO]: {
    primary: [
      '#ffffff', // White
      '#e0e0e0', // Light gray
      '#c0c0c0', // Medium-light gray
      '#a0a0a0', // Medium gray
      '#808080', // Gray
      '#606060', // Dark gray
    ],
    secondary: [
      '#f0f0f0', // Very light gray
      '#d0d0d0', // Light-medium gray
      '#909090', // Medium-dark gray
      '#404040', // Very dark gray
    ],
    background: '#000000',
    accent: '#ffffff',
  },
};

export function getColorFromPalette(
  palette: ColorPalette, 
  index: number, 
  useSecondary = false
): string {
  const colors = useSecondary ? palette.secondary : palette.primary;
  return colors[index % colors.length];
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  // Convert hex to RGB
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function addAlpha(color: string, alpha: number): string {
  // Convert hex to RGB with alpha
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}