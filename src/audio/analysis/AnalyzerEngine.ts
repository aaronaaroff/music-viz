import type { AudioAnalysisData } from '../types';

export class AnalyzerEngine {
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private previousVolume = 0;
  private beatThreshold = 0.3;
  private onsetThreshold = 0.2;
  private volumeHistory: number[] = [];
  private readonly historyLength = 10;

  analyze(analyzerNode: AnalyserNode): AudioAnalysisData {
    // Initialize arrays if needed
    if (!this.frequencyData || this.frequencyData.length !== analyzerNode.frequencyBinCount) {
      this.frequencyData = new Uint8Array(analyzerNode.frequencyBinCount);
      this.timeData = new Uint8Array(analyzerNode.fftSize);
    }

    // Get current data
    analyzerNode.getByteFrequencyData(this.frequencyData);
    analyzerNode.getByteTimeDomainData(this.timeData);

    // Calculate volume (RMS)
    const volume = this.calculateVolume(this.timeData);
    
    // Update volume history
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > this.historyLength) {
      this.volumeHistory.shift();
    }

    // Detect beat and onset
    const beat = this.detectBeat(volume);
    const onset = this.detectOnset(volume);

    // Calculate frequency band energies
    const bandEnergies = this.calculateBandEnergies(this.frequencyData);
    
    // Calculate spectral centroid
    const spectralCentroid = this.calculateSpectralCentroid(this.frequencyData);

    this.previousVolume = volume;

    return {
      frequencyData: new Uint8Array(this.frequencyData),
      timeData: new Uint8Array(this.timeData),
      volume,
      beat,
      onset,
      spectralCentroid,
      bassEnergy: bandEnergies.bass,
      midEnergy: bandEnergies.mid,
      highEnergy: bandEnergies.high,
    };
  }

  private calculateVolume(timeData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeData.length);
  }

  private detectBeat(volume: number): boolean {
    if (this.volumeHistory.length < this.historyLength) return false;
    
    const averageVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
    const volumeDiff = volume - this.previousVolume;
    
    return volumeDiff > this.beatThreshold && volume > averageVolume * 1.3;
  }

  private detectOnset(volume: number): boolean {
    const volumeDiff = volume - this.previousVolume;
    return volumeDiff > this.onsetThreshold;
  }

  private calculateBandEnergies(frequencyData: Uint8Array): {
    bass: number;
    mid: number;
    high: number;
  } {
    const bassEnd = Math.floor(frequencyData.length * 0.1);
    const midEnd = Math.floor(frequencyData.length * 0.5);
    
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    // Bass (0-10% of frequency range)
    for (let i = 0; i < bassEnd; i++) {
      bassEnergy += frequencyData[i];
    }
    bassEnergy /= bassEnd;

    // Mid (10-50% of frequency range)
    for (let i = bassEnd; i < midEnd; i++) {
      midEnergy += frequencyData[i];
    }
    midEnergy /= (midEnd - bassEnd);

    // High (50-100% of frequency range)
    for (let i = midEnd; i < frequencyData.length; i++) {
      highEnergy += frequencyData[i];
    }
    highEnergy /= (frequencyData.length - midEnd);

    return {
      bass: bassEnergy / 255,
      mid: midEnergy / 255,
      high: highEnergy / 255,
    };
  }

  private calculateSpectralCentroid(frequencyData: Uint8Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i];
      weightedSum += magnitude * i;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  setBeatThreshold(threshold: number): void {
    this.beatThreshold = Math.max(0, Math.min(1, threshold));
  }

  setOnsetThreshold(threshold: number): void {
    this.onsetThreshold = Math.max(0, Math.min(1, threshold));
  }
}