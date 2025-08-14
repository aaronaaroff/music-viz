import { AudioSource, AudioSourceType } from './types';
import type { AudioManagerState, AudioAnalysisData } from './types';
import { AnalyzerEngine } from './analysis/AnalyzerEngine';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioSource | null = null;
  private analyzerEngine: AnalyzerEngine | null = null;
  private animationFrame: number | null = null;
  private listeners: Set<(state: AudioManagerState) => void> = new Set();
  
  private state: AudioManagerState = {
    currentSource: null,
    sourceType: AudioSourceType.FILE,
    isPlaying: false,
    volume: 0.7,
    analysisData: null,
  };

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyzerEngine = new AnalyzerEngine();
    }

    // Resume context if suspended (required by many browsers)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async setSource(source: AudioSource, sourceType: AudioSourceType): Promise<void> {
    await this.initialize();
    
    // Stop current source
    if (this.currentSource) {
      this.currentSource.stop();
    }

    this.currentSource = source;
    this.state = {
      ...this.state,
      currentSource: source,
      sourceType
    };
    this.notifyListeners();
  }

  async startAnalysis(): Promise<void> {
    if (!this.currentSource || !this.analyzerEngine) {
      throw new Error('Audio source and analyzer must be initialized');
    }

    await this.currentSource.start();
    this.state = {
      ...this.state,
      isPlaying: true
    };
    
    // Start analysis loop
    this.startAnalysisLoop();
    this.notifyListeners();
  }

  stopAnalysis(): void {
    if (this.currentSource) {
      this.currentSource.stop();
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.state = {
      ...this.state,
      isPlaying: false,
      analysisData: null
    };
    this.notifyListeners();
  }

  setVolume(volume: number): void {
    if (this.currentSource) {
      this.currentSource.setVolume(volume);
    }
    this.state = {
      ...this.state,
      volume
    };
    this.notifyListeners();
  }

  getState(): AudioManagerState {
    return { ...this.state };
  }

  subscribe(listener: (state: AudioManagerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private startAnalysisLoop(): void {
    if (!this.currentSource || !this.analyzerEngine) return;

    const analyze = () => {
      if (!this.currentSource || !this.analyzerEngine || !this.state.isPlaying) {
        return;
      }

      const analyzer = this.currentSource.getAnalyzer();
      const analysisData = this.analyzerEngine.analyze(analyzer);
      
      // Create new state object to trigger React re-renders
      this.state = {
        ...this.state,
        analysisData
      };
      this.notifyListeners();
      
      this.animationFrame = requestAnimationFrame(analyze);
    };

    this.animationFrame = requestAnimationFrame(analyze);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  destroy(): void {
    this.stopAnalysis();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.listeners.clear();
  }
}