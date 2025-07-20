import { AudioSource } from '../types';
import type { AudioSourceConfig } from '../types';

export class FileSource extends AudioSource {
  private audioBuffer: AudioBuffer | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private file: File | null = null;
  private startTime = 0;
  private pauseTime = 0;

  constructor(audioContext: AudioContext, config: AudioSourceConfig = {}) {
    super(audioContext, config);
  }

  async loadFile(file: File): Promise<void> {
    this.file = file;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to load audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async start(): Promise<void> {
    if (!this.audioBuffer) {
      throw new Error('No audio file loaded');
    }

    this.stop(); // Stop any existing playback
    
    this.bufferSource = this.audioContext.createBufferSource();
    this.bufferSource.buffer = this.audioBuffer;
    
    this.connectSource(this.bufferSource);
    
    // Start playback from pause position
    this.startTime = this.audioContext.currentTime - this.pauseTime;
    this.bufferSource.start(0, this.pauseTime);
    this.isActive = true;
  }

  stop(): void {
    if (this.bufferSource && this.isActive) {
      try {
        this.bufferSource.stop();
      } catch (error) {
        // Buffer source might already be stopped
      }
      this.disconnectSource();
      this.bufferSource = null;
    }
    this.isActive = false;
  }

  pause(): void {
    if (this.isActive) {
      this.pauseTime = this.audioContext.currentTime - this.startTime;
      this.stop();
    }
  }

  seek(time: number): void {
    const wasPlaying = this.isActive;
    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));
    
    if (wasPlaying) {
      this.start();
    }
  }

  getCurrentTime(): number {
    if (!this.isActive) return this.pauseTime;
    return Math.min(this.audioContext.currentTime - this.startTime, this.getDuration());
  }

  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  isReady(): boolean {
    return this.audioBuffer !== null;
  }

  getFileName(): string {
    return this.file ? this.file.name : '';
  }

  getFileSize(): number {
    return this.file ? this.file.size : 0;
  }
}