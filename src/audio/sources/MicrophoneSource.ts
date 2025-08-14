import { AudioSource } from '../types';
import type { AudioSourceConfig } from '../types';

export class MicrophoneSource extends AudioSource {
  private mediaStream: MediaStream | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }
  };

  constructor(audioContext: AudioContext, config: AudioSourceConfig = {}) {
    super(audioContext, config);
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async start(): Promise<void> {
    // Check if already started
    if (this.isActive) {
      return;
    }

    try {
      // Get microphone stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia(this.constraints);
      
      // Create audio source from stream
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // For microphone, connect directly to analyzer and skip gain node to avoid feedback
      // This is different from other sources which use connectSource()
      this.sourceNode = this.mediaStreamSource;
      this.mediaStreamSource.connect(this.analyzerNode);
      
      // Disconnect analyzer from gain node to prevent any audio output
      try {
        this.analyzerNode.disconnect(this.gainNode);
      } catch (e) {
        // Might already be disconnected
      }
      
      this.isActive = true;
    } catch (error) {
      throw new Error(`Failed to start microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.mediaStreamSource) {
      try {
        this.mediaStreamSource.disconnect();
      } catch (e) {
        // Ignore disconnection errors
      }
      this.mediaStreamSource = null;
      this.sourceNode = null;
    }

    this.isActive = false;
  }

  isReady(): boolean {
    return true; // Microphone is always "ready" if permission is granted
  }

  setConstraints(constraints: MediaStreamConstraints): void {
    this.constraints = constraints;
  }

  getConstraints(): MediaStreamConstraints {
    return this.constraints;
  }

  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  async switchDevice(deviceId: string): Promise<void> {
    const wasActive = this.isActive;
    
    if (wasActive) {
      this.stop();
    }

    this.constraints = {
      ...this.constraints,
      audio: {
        ...(typeof this.constraints.audio === 'object' ? this.constraints.audio : {}),
        deviceId: { exact: deviceId }
      }
    };

    if (wasActive) {
      await this.start();
    }
  }

  getVolumeLevels(): { volume: number; peak: number } {
    if (!this.isActive) {
      return { volume: 0, peak: 0 };
    }

    // Get current analysis data
    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyzerNode.getByteTimeDomainData(dataArray);

    let sum = 0;
    let peak = 0;

    for (let i = 0; i < bufferLength; i++) {
      const value = Math.abs(dataArray[i] - 128) / 128;
      sum += value * value;
      peak = Math.max(peak, value);
    }

    const volume = Math.sqrt(sum / bufferLength);
    
    return { volume, peak };
  }
}