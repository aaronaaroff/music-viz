export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  volume: number;
  beat: boolean;
  onset: boolean;
  spectralCentroid: number;
  bassEnergy: number;
  midEnergy: number;
  highEnergy: number;
}

export interface AudioSourceConfig {
  sampleRate?: number;
  bufferSize?: number;
  smoothingTimeConstant?: number;
  fftSize?: number;
}

export abstract class AudioSource {
  protected audioContext: AudioContext;
  protected analyzerNode: AnalyserNode;
  protected sourceNode: AudioNode | null = null;
  protected gainNode: GainNode;
  protected isActive = false;

  constructor(audioContext: AudioContext, config: AudioSourceConfig = {}) {
    this.audioContext = audioContext;
    this.analyzerNode = audioContext.createAnalyser();
    this.gainNode = audioContext.createGain();
    
    // Configure analyzer
    this.analyzerNode.fftSize = config.fftSize || 2048;
    this.analyzerNode.smoothingTimeConstant = config.smoothingTimeConstant || 0.8;
    
    // Connect nodes
    this.analyzerNode.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);
  }

  abstract start(): Promise<void>;
  abstract stop(): void;
  abstract isReady(): boolean;

  getAnalyzer(): AnalyserNode {
    return this.analyzerNode;
  }

  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }

  getVolume(): number {
    return this.gainNode.gain.value;
  }

  protected connectSource(source: AudioNode): void {
    this.sourceNode = source;
    source.connect(this.analyzerNode);
  }

  protected disconnectSource(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }
}

export const AudioSourceType = {
  FILE: 'file',
  MICROPHONE: 'microphone',
  KEYBOARD: 'keyboard'
} as const;

export type AudioSourceType = typeof AudioSourceType[keyof typeof AudioSourceType];

export interface AudioManagerState {
  currentSource: AudioSource | null;
  sourceType: AudioSourceType;
  isPlaying: boolean;
  volume: number;
  analysisData: AudioAnalysisData | null;
}