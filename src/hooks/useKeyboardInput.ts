import { useEffect, useCallback, useRef } from 'react';
import { KeyboardSource } from '../audio/sources/KeyboardSource';

export function useKeyboardInput(keyboardSource: KeyboardSource | null, enabled: boolean = true) {
  const activeKeysRef = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !keyboardSource || activeKeysRef.current.has(event.key)) {
      return;
    }

    // Prevent default browser behavior for mapped keys
    const mappedKeys = Object.keys(keyboardSource.getKeyboardMapping());
    if (mappedKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }

    activeKeysRef.current.add(event.key);
    keyboardSource.handleKeyDown(event);
  }, [keyboardSource, enabled]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled || !keyboardSource) {
      return;
    }

    activeKeysRef.current.delete(event.key);
    keyboardSource.handleKeyUp(event);
  }, [keyboardSource, enabled]);

  const handleWindowBlur = useCallback(() => {
    // Clear all active keys when window loses focus
    if (keyboardSource && activeKeysRef.current.size > 0) {
      activeKeysRef.current.forEach(key => {
        keyboardSource.handleKeyUp({ key } as KeyboardEvent);
      });
      activeKeysRef.current.clear();
    }
  }, [keyboardSource]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      
      // Clear active keys on cleanup
      activeKeysRef.current.clear();
    };
  }, [handleKeyDown, handleKeyUp, handleWindowBlur, enabled]);

  const playNote = useCallback((note: string, velocity?: number, octave?: number) => {
    if (keyboardSource) {
      keyboardSource.playNote(note, velocity, octave);
    }
  }, [keyboardSource]);

  const stopNote = useCallback((noteKey: string) => {
    if (keyboardSource) {
      keyboardSource.stopNote(noteKey);
    }
  }, [keyboardSource]);

  const getActiveNotes = useCallback(() => {
    return keyboardSource ? keyboardSource.getActiveNotes() : [];
  }, [keyboardSource]);

  const getKeyboardMapping = useCallback(() => {
    return keyboardSource ? keyboardSource.getKeyboardMapping() : {};
  }, [keyboardSource]);

  return {
    playNote,
    stopNote,
    getActiveNotes,
    getKeyboardMapping,
  };
}