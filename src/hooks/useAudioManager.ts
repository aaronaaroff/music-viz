import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioManager } from '../audio/AudioManager';
import { AudioSource, AudioSourceType } from '../audio/types';
import type { AudioManagerState } from '../audio/types';

export function useAudioManager() {
  const [state, setState] = useState<AudioManagerState>({
    currentSource: null,
    sourceType: AudioSourceType.FILE,
    isPlaying: false,
    volume: 0.7,
    analysisData: null,
  });

  const audioManagerRef = useRef<AudioManager | null>(null);

  useEffect(() => {
    // Initialize audio manager
    audioManagerRef.current = new AudioManager();
    
    // Subscribe to state changes
    const unsubscribe = audioManagerRef.current.subscribe(setState);

    return () => {
      unsubscribe();
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
      }
    };
  }, []);

  const setSource = useCallback(async (source: AudioSource, sourceType: AudioSourceType) => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.setSource(source, sourceType);
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.startAnalysis();
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stopAnalysis();
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setVolume(volume);
    }
  }, []);

  return {
    state,
    setSource,
    startAnalysis,
    stopAnalysis,
    setVolume,
  };
}