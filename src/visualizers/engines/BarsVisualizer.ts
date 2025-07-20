import { VisualizationEngine } from '../types';
import type { AudioAnalysisData, VisualizationSettings } from '../types';
import { COLOR_THEMES, getColorFromPalette, addAlpha } from '../themes/colorThemes';

interface BarData {
  height: number;
  targetHeight: number;
  color: string;
  glowIntensity: number;
}

export class BarsVisualizer extends VisualizationEngine {
  private bars: BarData[] = [];
  private barWidth = 0;
  private barSpacing = 2;
  private maxBarHeight = 0;
  private beatPulse = 0;
  private onsetFlash = 0;

  constructor(canvas: HTMLCanvasElement, settings: VisualizationSettings) {
    super(canvas, settings);
    this.initializeBars();
    this.updateCanvasSize();
  }

  private initializeBars(): void {
    this.bars = [];
    const barCount = Math.min(this.settings.particleCount, 128); // Limit bars for performance
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    for (let i = 0; i < barCount; i++) {
      const color = getColorFromPalette(colorPalette, i);
      
      this.bars.push({
        height: 0,
        targetHeight: 0,
        color,
        glowIntensity: 0,
      });
    }
  }

  private updateCanvasSize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.maxBarHeight = rect.height * 0.8;
    this.barWidth = Math.max(2, (rect.width - (this.bars.length * this.barSpacing)) / this.bars.length);
  }

  render(audioData: AudioAnalysisData): void {
    // Update canvas size if needed
    const rect = this.canvas.getBoundingClientRect();
    if (this.barWidth === 0 || this.maxBarHeight !== rect.height * 0.8) {
      this.updateCanvasSize();
    }

    // Clear canvas with background trail effect
    this.ctx.fillStyle = addAlpha(COLOR_THEMES[this.settings.colorTheme].background, 
                                  1 - this.settings.backgroundOpacity);
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    // Update animation values
    this.updateAnimationState(audioData);
    
    // Update bars based on frequency data
    this.updateBars(audioData);
    
    // Render bars
    this.renderBars();
    
    // Apply beat effects
    this.renderEffects(audioData);
  }

  private updateAnimationState(audioData: AudioAnalysisData): void {
    // Beat pulse effect
    if (this.settings.pulseBeatSync && audioData.beat) {
      this.beatPulse = 1.0;
    } else {
      this.beatPulse *= 0.9; // Decay
    }
    
    // Onset flash effect
    if (this.settings.flashOnset && audioData.onset) {
      this.onsetFlash = 1.0;
    } else {
      this.onsetFlash *= 0.85; // Decay
    }
  }

  private updateBars(audioData: AudioAnalysisData): void {
    const frequencyData = audioData.frequencyData;
    const binsPerBar = Math.max(1, Math.floor(frequencyData.length / this.bars.length));
    
    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      
      // Average frequency data across multiple bins for each bar
      let sum = 0;
      const startBin = i * binsPerBar;
      const endBin = Math.min(startBin + binsPerBar, frequencyData.length);
      
      for (let j = startBin; j < endBin; j++) {
        sum += frequencyData[j];
      }
      
      const avgFrequency = sum / (endBin - startBin);
      const normalizedFrequency = avgFrequency / 255;
      
      // Calculate target height with sensitivity and scale
      const sensitivity = this.settings.sensitivity;
      const sizeScale = this.settings.sizeScale;
      
      bar.targetHeight = normalizedFrequency * sensitivity * this.maxBarHeight * sizeScale;
      
      // Add beat pulse effect
      if (this.settings.pulseBeatSync && this.beatPulse > 0) {
        bar.targetHeight += this.beatPulse * 20;
      }
      
      // Update glow intensity
      bar.glowIntensity = normalizedFrequency * sensitivity;
      
      // Smooth interpolation
      const smoothing = this.settings.smoothing;
      bar.height = this.interpolate(bar.height, bar.targetHeight, 1 - smoothing);
    }
  }

  private renderBars(): void {
    const rect = this.canvas.getBoundingClientRect();
    const baseY = rect.height - 20; // Leave some margin at bottom
    
    this.bars.forEach((bar, index) => {
      if (bar.height < 1) return; // Skip very small bars
      
      const x = index * (this.barWidth + this.barSpacing) + this.barSpacing;
      const y = baseY - bar.height;
      
      // Set up glow effect
      if (this.settings.glowIntensity > 0 && bar.glowIntensity > 0.1) {
        this.ctx.shadowBlur = this.settings.glowIntensity * bar.glowIntensity * 20;
        this.ctx.shadowColor = bar.color;
      } else {
        this.ctx.shadowBlur = 0;
      }
      
      // Create gradient for the bar
      const gradient = this.ctx.createLinearGradient(x, y, x, baseY);
      gradient.addColorStop(0, addAlpha(bar.color, 0.9));
      gradient.addColorStop(0.5, addAlpha(bar.color, 0.7));
      gradient.addColorStop(1, addAlpha(bar.color, 0.3));
      
      this.ctx.fillStyle = gradient;
      
      // Draw bar with rounded top
      this.ctx.beginPath();
      const radius = Math.min(this.barWidth / 2, 3);
      this.ctx.roundRect(x, y, this.barWidth, bar.height, [radius, radius, 0, 0]);
      this.ctx.fill();
      
      // Add highlight on top for extra effect
      if (bar.height > 10) {
        this.ctx.fillStyle = addAlpha(bar.color, 0.8);
        this.ctx.fillRect(x, y, this.barWidth, 2);
      }
    });
  }

  private renderEffects(audioData: AudioAnalysisData): void {
    const rect = this.canvas.getBoundingClientRect();
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    // Onset flash effect
    if (this.onsetFlash > 0.1) {
      this.ctx.fillStyle = addAlpha(colorPalette.accent, this.onsetFlash * 0.08);
      this.ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    // Beat effect - pulsing baseline
    if (this.beatPulse > 0.1) {
      const baseY = rect.height - 20;
      const pulseHeight = this.beatPulse * 5;
      
      this.ctx.fillStyle = addAlpha(colorPalette.accent, this.beatPulse * 0.6);
      this.ctx.fillRect(0, baseY - pulseHeight, rect.width, pulseHeight);
    }
    
    // Volume-responsive background pulse
    if (audioData.volume > 0.1) {
      const alpha = audioData.volume * 0.03;
      this.ctx.fillStyle = addAlpha(colorPalette.primary[0], alpha);
      this.ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }

  updateSettings(newSettings: Partial<VisualizationSettings>): void {
    super.updateSettings(newSettings);
    
    // Reinitialize bars if count changed
    if (newSettings.particleCount && newSettings.particleCount !== this.bars.length) {
      this.initializeBars();
      this.updateCanvasSize();
    }
    
    // Update colors if theme changed
    if (newSettings.colorTheme) {
      const colorPalette = COLOR_THEMES[this.settings.colorTheme];
      this.bars.forEach((bar, index) => {
        bar.color = getColorFromPalette(colorPalette, index);
      });
    }
  }

  cleanup(): void {
    // Reset animation state
    this.beatPulse = 0;
    this.onsetFlash = 0;
    this.bars = [];
  }
}