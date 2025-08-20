import type { AudioAnalysisData } from '../audio/types';

export type { AudioAnalysisData };

export enum VisualizationType {
  CIRCLE = 'circle',
  BARS = 'bars',
  WAVE = 'wave'
}

export enum ColorTheme {
  NEON = 'neon',
  SUNSET = 'sunset',
  MONO = 'mono'
}

export interface VisualizationSettings {
  // Shape and type
  type: VisualizationType;
  colorTheme: ColorTheme;
  
  // Audio responsiveness
  sensitivity: number;      // 0-1, how responsive to audio changes
  smoothing: number;        // 0-1, animation smoothing/damping
  sizeScale: number;        // 0-1, overall size multiplier
  
  // Visual parameters
  particleCount: number;    // Number of elements (bars, particles, etc.)
  glowIntensity: number;    // Glow/bloom effect intensity
  backgroundOpacity: number; // Background trail opacity for motion blur
  
  // Animation
  rotationSpeed: number;    // Base rotation speed
  pulseBeatSync: boolean;   // Whether to pulse on beat detection
  flashOnset: boolean;      // Whether to flash on onset detection
}

export interface ColorPalette {
  primary: string[];        // Main colors for visualization
  secondary: string[];      // Accent colors
  background: string;       // Background color
  accent: string;          // Highlight color for beats/onsets
}

export interface VisualizationFrame {
  timestamp: number;
  audioData: AudioAnalysisData;
  settings: VisualizationSettings;
}

export abstract class VisualizationEngine {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected settings: VisualizationSettings;
  protected animationId: number | null = null;
  protected lastTimestamp = 0;
  
  constructor(canvas: HTMLCanvasElement, settings: VisualizationSettings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;
    this.setupCanvas();
  }

  abstract render(audioData: AudioAnalysisData): void;
  abstract cleanup(): void;

  updateSettings(newSettings: Partial<VisualizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): VisualizationSettings {
    return { ...this.settings };
  }

  protected setupCanvas(): void {
    // Set up high DPI canvas
    const rect = this.canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;
    
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  protected clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  protected applyGlow(intensity: number): void {
    if (intensity > 0) {
      this.ctx.shadowBlur = intensity * 20;
      this.ctx.shadowColor = this.ctx.fillStyle as string;
    } else {
      this.ctx.shadowBlur = 0;
    }
  }

  protected interpolate(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  protected mapAudioToRange(value: number, min: number, max: number): number {
    return min + (max - min) * Math.min(1, Math.max(0, value));
  }
}

export const DEFAULT_VISUALIZATION_SETTINGS: VisualizationSettings = {
  type: VisualizationType.CIRCLE,
  colorTheme: ColorTheme.NEON,
  sensitivity: 0.7,
  smoothing: 0.8,
  sizeScale: 0.8,
  particleCount: 64,
  glowIntensity: 0.6,
  backgroundOpacity: 0.05,
  rotationSpeed: 0.2,
  pulseBeatSync: true,
  flashOnset: true,
};