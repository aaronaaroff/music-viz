import { VisualizationEngine } from '../types';
import type { AudioAnalysisData, VisualizationSettings } from '../types';
import { COLOR_THEMES, getColorFromPalette, addAlpha } from '../themes/colorThemes';

interface WavePoint {
  x: number;
  y: number;
  targetY: number;
  amplitude: number;
  color: string;
}

export class WaveVisualizer extends VisualizationEngine {
  private wavePoints: WavePoint[] = [];
  private centerY = 0;
  private waveWidth = 0;
  private maxAmplitude = 0;
  private phase = 0;
  private beatPulse = 0;
  private onsetFlash = 0;

  constructor(canvas: HTMLCanvasElement, settings: VisualizationSettings) {
    super(canvas, settings);
    this.initializeWavePoints();
    this.updateCanvasSize();
  }

  private initializeWavePoints(): void {
    this.wavePoints = [];
    const pointCount = Math.min(this.settings.particleCount * 2, 256); // More points for smoother wave
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    for (let i = 0; i < pointCount; i++) {
      const x = (i / (pointCount - 1)) * this.waveWidth;
      const color = getColorFromPalette(colorPalette, i);
      
      this.wavePoints.push({
        x,
        y: this.centerY,
        targetY: this.centerY,
        amplitude: 0,
        color,
      });
    }
  }

  private updateCanvasSize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.centerY = rect.height / 2;
    this.waveWidth = rect.width;
    this.maxAmplitude = rect.height * 0.3;
    
    // Update point positions when canvas size changes
    this.wavePoints.forEach((point, index) => {
      point.x = (index / (this.wavePoints.length - 1)) * this.waveWidth;
    });
  }

  render(audioData: AudioAnalysisData): void {
    // Update canvas size if needed
    const rect = this.canvas.getBoundingClientRect();
    if (this.centerY !== rect.height / 2 || this.waveWidth !== rect.width) {
      this.updateCanvasSize();
    }

    // Clear canvas with background trail effect
    this.ctx.fillStyle = addAlpha(COLOR_THEMES[this.settings.colorTheme].background, 
                                  1 - this.settings.backgroundOpacity);
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    // Update animation values
    this.updateAnimationState(audioData);
    
    // Update wave points based on frequency data
    this.updateWavePoints(audioData);
    
    // Render wave
    this.renderWave();
    
    // Apply beat effects
    this.renderEffects(audioData);
  }

  private updateAnimationState(audioData: AudioAnalysisData): void {
    // Update phase for wave movement
    this.phase += this.settings.rotationSpeed * 0.05;
    
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

  private updateWavePoints(audioData: AudioAnalysisData): void {
    const frequencyData = audioData.frequencyData;
    const binsPerPoint = Math.max(1, Math.floor(frequencyData.length / this.wavePoints.length));
    
    for (let i = 0; i < this.wavePoints.length; i++) {
      const point = this.wavePoints[i];
      
      // Map point to frequency bin
      const binIndex = Math.floor(i * binsPerPoint);
      const frequency = frequencyData[Math.min(binIndex, frequencyData.length - 1)] / 255;
      
      // Calculate amplitude with sensitivity and scale
      const sensitivity = this.settings.sensitivity;
      const sizeScale = this.settings.sizeScale;
      
      point.amplitude = frequency * sensitivity * this.maxAmplitude * sizeScale;
      
      // Add wave motion
      const waveOffset = Math.sin((i / this.wavePoints.length) * Math.PI * 4 + this.phase) * 20;
      
      // Calculate target Y position
      point.targetY = this.centerY + point.amplitude * Math.sin((i / this.wavePoints.length) * Math.PI * 2 + this.phase) + waveOffset;
      
      // Add beat pulse effect
      if (this.settings.pulseBeatSync && this.beatPulse > 0) {
        point.targetY += Math.sin((i / this.wavePoints.length) * Math.PI * 2) * this.beatPulse * 30;
      }
      
      // Smooth interpolation
      const smoothing = this.settings.smoothing;
      point.y = this.interpolate(point.y, point.targetY, 1 - smoothing);
    }
  }

  private renderWave(): void {
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    // Render multiple wave layers for depth
    this.renderWaveLayer(1.0, 3, colorPalette.primary[0]);
    this.renderWaveLayer(0.7, 2, colorPalette.primary[1] || colorPalette.primary[0]);
    this.renderWaveLayer(0.4, 1, colorPalette.accent);
    
    // Render particles at wave peaks
    this.renderWaveParticles();
  }

  private renderWaveLayer(amplitudeMultiplier: number, lineWidth: number, color: string): void {
    if (this.wavePoints.length < 2) return;
    
    // Set up glow effect
    if (this.settings.glowIntensity > 0) {
      this.ctx.shadowBlur = this.settings.glowIntensity * 10;
      this.ctx.shadowColor = color;
    } else {
      this.ctx.shadowBlur = 0;
    }
    
    this.ctx.strokeStyle = addAlpha(color, 0.8 * amplitudeMultiplier);
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Draw smooth curve through points
    this.ctx.beginPath();
    this.ctx.moveTo(this.wavePoints[0].x, this.centerY + (this.wavePoints[0].y - this.centerY) * amplitudeMultiplier);
    
    for (let i = 1; i < this.wavePoints.length; i++) {
      const prevPoint = this.wavePoints[i - 1];
      const currentPoint = this.wavePoints[i];
      
      const prevY = this.centerY + (prevPoint.y - this.centerY) * amplitudeMultiplier;
      const currentY = this.centerY + (currentPoint.y - this.centerY) * amplitudeMultiplier;
      
      // Create smooth curve using quadratic bezier
      const cpX = (prevPoint.x + currentPoint.x) / 2;
      const cpY = (prevY + currentY) / 2;
      
      this.ctx.quadraticCurveTo(prevPoint.x, prevY, cpX, cpY);
    }
    
    // Complete the last segment
    const lastPoint = this.wavePoints[this.wavePoints.length - 1];
    const lastY = this.centerY + (lastPoint.y - this.centerY) * amplitudeMultiplier;
    this.ctx.lineTo(lastPoint.x, lastY);
    
    this.ctx.stroke();
  }

  private renderWaveParticles(): void {
    // Only show particles at significant wave peaks
    this.wavePoints.forEach((point, index) => {
      const amplitude = Math.abs(point.y - this.centerY);
      if (amplitude < 20) return; // Skip small amplitudes
      
      const size = Math.min(8, amplitude / 20);
      const alpha = Math.min(1, amplitude / this.maxAmplitude);
      
      this.ctx.fillStyle = addAlpha(point.color, alpha * 0.8);
      
      if (this.settings.glowIntensity > 0) {
        this.ctx.shadowBlur = this.settings.glowIntensity * 8;
        this.ctx.shadowColor = point.color;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private renderEffects(audioData: AudioAnalysisData): void {
    const rect = this.canvas.getBoundingClientRect();
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    // Center line
    this.ctx.strokeStyle = addAlpha(colorPalette.accent, 0.1);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.centerY);
    this.ctx.lineTo(rect.width, this.centerY);
    this.ctx.stroke();
    
    // Onset flash effect
    if (this.onsetFlash > 0.1) {
      this.ctx.fillStyle = addAlpha(colorPalette.accent, this.onsetFlash * 0.05);
      this.ctx.fillRect(0, 0, rect.width, rect.height);
    }
    
    // Beat effect - vertical lines at wave extremes
    if (this.beatPulse > 0.1) {
      this.ctx.strokeStyle = addAlpha(colorPalette.accent, this.beatPulse * 0.3);
      this.ctx.lineWidth = 2;
      
      for (let i = 0; i < this.wavePoints.length; i += 20) {
        const point = this.wavePoints[i];
        const amplitude = Math.abs(point.y - this.centerY);
        
        if (amplitude > 30) {
          this.ctx.beginPath();
          this.ctx.moveTo(point.x, this.centerY - amplitude * 1.5);
          this.ctx.lineTo(point.x, this.centerY + amplitude * 1.5);
          this.ctx.stroke();
        }
      }
    }
  }

  updateSettings(newSettings: Partial<VisualizationSettings>): void {
    super.updateSettings(newSettings);
    
    // Reinitialize wave points if count changed
    if (newSettings.particleCount && newSettings.particleCount * 2 !== this.wavePoints.length) {
      this.initializeWavePoints();
    }
    
    // Update colors if theme changed
    if (newSettings.colorTheme) {
      const colorPalette = COLOR_THEMES[this.settings.colorTheme];
      this.wavePoints.forEach((point, index) => {
        point.color = getColorFromPalette(colorPalette, index);
      });
    }
  }

  cleanup(): void {
    // Reset animation state
    this.phase = 0;
    this.beatPulse = 0;
    this.onsetFlash = 0;
    this.wavePoints = [];
  }
}