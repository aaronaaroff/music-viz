import { AudioSource } from '../types';
import type { AudioSourceConfig } from '../types';

export interface KeyboardNote {
  frequency: number;
  velocity: number;
  startTime: number;
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export interface SynthSettings {
  waveform: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFrequency: number;
  filterResonance: number;
  reverbAmount: number;
}

export class KeyboardSource extends AudioSource {
  private activeNotes: Map<string, KeyboardNote> = new Map();
  private masterGain: GainNode;
  private filter: BiquadFilterNode;
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode;
  private dryGain: GainNode;

  private settings: SynthSettings = {
    waveform: 'sawtooth',
    attack: 0.01,
    decay: 0.3,
    sustain: 0.7,
    release: 0.5,
    filterFrequency: 2000,
    filterResonance: 1,
    reverbAmount: 0.2,
  };

  // Musical note frequencies (A4 = 440Hz)
  private noteFrequencies: { [key: string]: number } = {
    'C': 261.63,  'C#': 277.18, 'D': 293.66,  'D#': 311.13,
    'E': 329.63,  'F': 349.23,  'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00,  'A#': 466.16, 'B': 493.88,
  };

  // Keyboard mapping (QWERTY to notes)
  private keyboardMapping: { [key: string]: string } = {
    'q': 'C', '2': 'C#', 'w': 'D', '3': 'D#', 'e': 'E',
    'r': 'F', '5': 'F#', 't': 'G', '6': 'G#', 'y': 'A',
    '7': 'A#', 'u': 'B', 'i': 'C5',
    'z': 'C3', 's': 'C#3', 'x': 'D3', 'd': 'D#3', 'c': 'E3',
    'v': 'F3', 'g': 'F#3', 'b': 'G3', 'h': 'G#3', 'n': 'A3',
    'j': 'A#3', 'm': 'B3',
  };

  constructor(audioContext: AudioContext, config: AudioSourceConfig = {}) {
    super(audioContext, config);
    
    // Create additional nodes for synthesis
    this.masterGain = this.audioContext.createGain();
    this.filter = this.audioContext.createBiquadFilter();
    this.reverbGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();

    // Configure filter
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.settings.filterFrequency;
    this.filter.Q.value = this.settings.filterResonance;

    // Connect audio graph
    this.masterGain.connect(this.filter);
    this.filter.connect(this.dryGain);
    this.filter.connect(this.reverbGain);
    this.dryGain.connect(this.analyzerNode);

    // Initialize reverb
    this.initializeReverb();
    this.updateReverbMix();
  }

  async start(): Promise<void> {
    this.isActive = true;
  }

  stop(): void {
    // Stop all active notes
    this.activeNotes.forEach((note, key) => {
      this.stopNote(key);
    });
    this.isActive = false;
  }

  isReady(): boolean {
    return true;
  }

  playNote(note: string, velocity: number = 0.7, octave: number = 4): void {
    if (!this.isActive) return;

    const frequency = this.getNoteFrequency(note, octave);
    if (!frequency) return;

    const noteKey = `${note}${octave}`;
    
    // Stop existing note if playing
    if (this.activeNotes.has(noteKey)) {
      this.stopNote(noteKey);
    }

    // Create oscillator and gain for this note
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = this.settings.waveform;
    oscillator.frequency.value = frequency;
    
    // Connect oscillator -> gain -> master gain
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Apply ADSR envelope
    const now = this.audioContext.currentTime;
    const attackEnd = now + this.settings.attack;
    const decayEnd = attackEnd + this.settings.decay;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, attackEnd);
    gainNode.gain.linearRampToValueAtTime(velocity * this.settings.sustain, decayEnd);
    
    // Start oscillator
    oscillator.start(now);
    
    // Store note
    this.activeNotes.set(noteKey, {
      frequency,
      velocity,
      startTime: now,
      oscillator,
      gainNode,
    });
  }

  stopNote(noteKey: string): void {
    const note = this.activeNotes.get(noteKey);
    if (!note) return;

    const now = this.audioContext.currentTime;
    const releaseEnd = now + this.settings.release;
    
    // Apply release envelope
    note.gainNode.gain.cancelScheduledValues(now);
    note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
    note.gainNode.gain.linearRampToValueAtTime(0, releaseEnd);
    
    // Stop oscillator after release
    note.oscillator.stop(releaseEnd);
    
    // Clean up
    this.activeNotes.delete(noteKey);
  }

  // Keyboard event handlers
  handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const note = this.keyboardMapping[key];
    
    if (note && !event.repeat) {
      const octave = note.includes('3') ? 3 : note.includes('5') ? 5 : 4;
      const noteName = note.replace(/[35]/, '');
      this.playNote(noteName, 0.7, octave);
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const note = this.keyboardMapping[key];
    
    if (note) {
      const octave = note.includes('3') ? 3 : note.includes('5') ? 5 : 4;
      const noteName = note.replace(/[35]/, '');
      const noteKey = `${noteName}${octave}`;
      this.stopNote(noteKey);
    }
  }

  // Settings management
  updateSettings(newSettings: Partial<SynthSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Apply settings to filter
    if (newSettings.filterFrequency !== undefined) {
      this.filter.frequency.setValueAtTime(
        newSettings.filterFrequency,
        this.audioContext.currentTime
      );
    }
    
    if (newSettings.filterResonance !== undefined) {
      this.filter.Q.setValueAtTime(
        newSettings.filterResonance,
        this.audioContext.currentTime
      );
    }

    if (newSettings.reverbAmount !== undefined) {
      this.updateReverbMix();
    }
  }

  getSettings(): SynthSettings {
    return { ...this.settings };
  }

  getActiveNotes(): string[] {
    return Array.from(this.activeNotes.keys());
  }

  getKeyboardMapping(): { [key: string]: string } {
    return { ...this.keyboardMapping };
  }

  private getNoteFrequency(note: string, octave: number): number | null {
    const baseFrequency = this.noteFrequencies[note];
    if (!baseFrequency) return null;
    
    // Calculate frequency for the given octave (A4 = 440Hz is octave 4)
    const octaveMultiplier = Math.pow(2, octave - 4);
    return baseFrequency * octaveMultiplier;
  }

  private async initializeReverb(): Promise<void> {
    try {
      this.convolver = this.audioContext.createConvolver();
      
      // Create simple reverb impulse response
      const sampleRate = this.audioContext.sampleRate;
      const length = sampleRate * 2; // 2 second reverb
      const impulse = this.audioContext.createBuffer(2, length, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = Math.pow(1 - i / length, 2);
          channelData[i] = (Math.random() * 2 - 1) * decay;
        }
      }
      
      this.convolver.buffer = impulse;
      this.reverbGain.connect(this.convolver);
      this.convolver.connect(this.analyzerNode);
    } catch (error) {
      console.warn('Failed to initialize reverb:', error);
    }
  }

  private updateReverbMix(): void {
    const dryAmount = 1 - this.settings.reverbAmount;
    const wetAmount = this.settings.reverbAmount;
    
    this.dryGain.gain.setValueAtTime(dryAmount, this.audioContext.currentTime);
    this.reverbGain.gain.setValueAtTime(wetAmount, this.audioContext.currentTime);
  }
}