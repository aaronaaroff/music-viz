import { VisualizationEngine } from '../types';
import type { AudioAnalysisData, VisualizationSettings } from '../types';
import { COLOR_THEMES, getColorFromPalette, addAlpha } from '../themes/colorThemes';

interface CircleParticle {
  angle: number;
  radius: number;
  targetRadius: number;
  intensity: number;
  targetIntensity: number;
  color: string;
}

export class CircleVisualizer extends VisualizationEngine {
  private particles: CircleParticle[] = [];
  private centerX = 0;
  private centerY = 0;
  private baseRadius = 50;
  private rotation = 0;
  private beatPulse = 0;
  private onsetFlash = 0;

  constructor(canvas: HTMLCanvasElement, settings: VisualizationSettings) {
    super(canvas, settings);
    this.initializeParticles();
    this.updateCanvasSize();
  }

  private initializeParticles(): void {
    this.particles = [];
    const particleCount = this.settings.particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const colorPalette = COLOR_THEMES[this.settings.colorTheme];
      const color = getColorFromPalette(colorPalette, i);
      
      this.particles.push({
        angle,
        radius: this.baseRadius,
        targetRadius: this.baseRadius,
        intensity: 0,
        targetIntensity: 0,
        color,
      });
    }
  }

  private updateCanvasSize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.centerX = rect.width / 2;
    this.centerY = rect.height / 2;
    this.baseRadius = Math.min(rect.width, rect.height) * 0.15;
  }

  render(audioData: AudioAnalysisData): void {
    // Update canvas size if needed
    const rect = this.canvas.getBoundingClientRect();
    if (this.centerX !== rect.width / 2 || this.centerY !== rect.height / 2) {
      this.updateCanvasSize();
    }

    // Clear with background trail effect
    this.ctx.fillStyle = addAlpha(COLOR_THEMES[this.settings.colorTheme].background, 
                                  1 - this.settings.backgroundOpacity);
    this.ctx.fillRect(0, 0, rect.width, rect.height);

    // Update animation values
    this.updateAnimationState(audioData);
    
    // Update particles based on frequency data
    this.updateParticles(audioData);
    
    // Render particles
    this.renderParticles();
    
    // Apply beat effects
    this.renderEffects(audioData);
  }

  private updateAnimationState(audioData: AudioAnalysisData): void {
    // Update rotation
    this.rotation += this.settings.rotationSpeed * 0.01;
    
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

  private updateParticles(audioData: AudioAnalysisData): void {
    const frequencyData = audioData.frequencyData;
    const particlesPerBin = this.particles.length / frequencyData.length;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Map particle to frequency bin
      const binIndex = Math.floor(i / particlesPerBin);
      const frequency = frequencyData[binIndex] / 255;
      
      // Calculate target values
      const sensitivity = this.settings.sensitivity;
      const sizeScale = this.settings.sizeScale;
      
      particle.targetIntensity = frequency * sensitivity;
      particle.targetRadius = this.baseRadius + (frequency * sensitivity * 100 * sizeScale);
      
      // Add beat pulse effect
      if (this.settings.pulseBeatSync && this.beatPulse > 0) {
        particle.targetRadius += this.beatPulse * 20;
      }
      
      // Smooth interpolation
      const smoothing = this.settings.smoothing;
      particle.intensity = this.interpolate(particle.intensity, particle.targetIntensity, 1 - smoothing);
      particle.radius = this.interpolate(particle.radius, particle.targetRadius, 1 - smoothing);
    }
  }

  private renderParticles(): void {
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    this.particles.forEach((particle, index) => {
      if (particle.intensity < 0.01) return; // Skip very quiet particles
      
      // Calculate position
      const angle = particle.angle + this.rotation;
      const x = this.centerX + Math.cos(angle) * particle.radius;
      const y = this.centerY + Math.sin(angle) * particle.radius;
      
      // Set up rendering
      const alpha = particle.intensity;
      const size = 2 + particle.intensity * 8;
      
      this.ctx.fillStyle = addAlpha(particle.color, alpha);
      
      // Apply glow effect
      if (this.settings.glowIntensity > 0) {
        this.ctx.shadowBlur = this.settings.glowIntensity * 15;
        this.ctx.shadowColor = particle.color;
      } else {
        this.ctx.shadowBlur = 0;
      }
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw connecting lines to center (optional, based on intensity)
      if (particle.intensity > 0.3) {
        this.ctx.strokeStyle = addAlpha(particle.color, alpha * 0.3);
        this.ctx.lineWidth = particle.intensity * 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }
    });
  }

  private renderEffects(audioData: AudioAnalysisData): void {
    const colorPalette = COLOR_THEMES[this.settings.colorTheme];
    
    // Center circle responding to overall volume
    const centerSize = 10 + audioData.volume * 30 * this.settings.sizeScale;
    this.ctx.fillStyle = addAlpha(colorPalette.accent, audioData.volume * 0.8);
    
    if (this.settings.glowIntensity > 0) {
      this.ctx.shadowBlur = this.settings.glowIntensity * 20;
      this.ctx.shadowColor = colorPalette.accent;
    }
    
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, centerSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Onset flash effect
    if (this.onsetFlash > 0.1) {
      this.ctx.fillStyle = addAlpha(colorPalette.accent, this.onsetFlash * 0.1);
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Beat ring effect
    if (this.beatPulse > 0.1) {
      const ringRadius = this.baseRadius * 2 + this.beatPulse * 50;
      this.ctx.strokeStyle = addAlpha(colorPalette.accent, this.beatPulse * 0.5);
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  updateSettings(newSettings: Partial<VisualizationSettings>): void {
    super.updateSettings(newSettings);
    
    // Reinitialize particles if count changed
    if (newSettings.particleCount && newSettings.particleCount !== this.particles.length) {
      this.initializeParticles();
    }
    
    // Update colors if theme changed
    if (newSettings.colorTheme) {
      const colorPalette = COLOR_THEMES[this.settings.colorTheme];
      this.particles.forEach((particle, index) => {
        particle.color = getColorFromPalette(colorPalette, index);
      });
    }
  }

  cleanup(): void {
    // Reset animation state
    this.rotation = 0;
    this.beatPulse = 0;
    this.onsetFlash = 0;
    this.particles = [];
  }
}