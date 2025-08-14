import { useState, useCallback, useEffect, useRef } from 'react';
import { KeyboardSource } from '../audio/sources/KeyboardSource';

interface KeyboardMapping {
  [key: string]: string;
}

const defaultMapping: KeyboardMapping = {
  'a': 'C4',
  'w': 'C#4',
  's': 'D4',
  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',
  't': 'F#4',
  'g': 'G4',
  'y': 'G#4',
  'h': 'A4',
  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',
  'o': 'C#5',
  'l': 'D5',
  'p': 'D#5',
  ';': 'E5',
  "'": 'F5',
  '[': 'F#5',
  'm': 'G5',
  ']': 'G#5',
  ',': 'A5',
  '\\': 'A#5',
  '.': 'B5',
  '/': 'C6',
};

export function useKeyboardInput() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState<boolean>(false);
  const keyboardSourceRef = useRef<KeyboardSource | null>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());

  const startKeyboard = useCallback(async () => {
    if (!keyboardSourceRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      keyboardSourceRef.current = new KeyboardSource(audioContext);
    }
    await keyboardSourceRef.current.start();
    setIsKeyboardEnabled(true);
  }, []);

  const stopKeyboard = useCallback(() => {
    if (keyboardSourceRef.current) {
      keyboardSourceRef.current.stop();
    }
    setIsKeyboardEnabled(false);
  }, []);

  const handleNoteOn = useCallback((note: string, velocity: number = 0.7, octave: number = 4) => {
    const noteKey = `${note}${octave}`;
    
    if (keyboardSourceRef.current) {
      keyboardSourceRef.current.playNote(note, velocity, octave);
    }
    
    setActiveNote(noteKey);
    setActiveNotes(prev => {
      if (!prev.includes(noteKey)) {
        return [...prev, noteKey];
      }
      return prev;
    });
  }, []);

  const handleNoteOff = useCallback((noteKey: string) => {
    if (keyboardSourceRef.current) {
      keyboardSourceRef.current.stopNote(noteKey);
    }
    
    setActiveNotes(prev => prev.filter(n => n !== noteKey));
    
    // If this was the active note, clear it
    if (activeNote === noteKey) {
      setActiveNote(null);
    }
  }, [activeNote]);

  // Physical keyboard event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only check if input/textarea is focused, not keyboard enabled
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    
    const key = event.key.toLowerCase();
    
    if (defaultMapping[key] && !activeKeysRef.current.has(key)) {
      event.preventDefault();
      activeKeysRef.current.add(key);
      
      const noteKey = defaultMapping[key];
      const note = noteKey.replace(/\d+/, '');
      const octave = parseInt(noteKey.replace(/[A-G]#?/, ''));
      
      handleNoteOn(note, 0.7, octave);
    }
  }, [handleNoteOn]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    if (defaultMapping[key] && activeKeysRef.current.has(key)) {
      activeKeysRef.current.delete(key);
      const noteKey = defaultMapping[key];
      handleNoteOff(noteKey);
    }
  }, [handleNoteOff]);

  // Window blur handler to stop all notes
  const handleWindowBlur = useCallback(() => {
    // Stop all active notes
    activeNotes.forEach(noteKey => {
      handleNoteOff(noteKey);
    });
    activeKeysRef.current.clear();
  }, [activeNotes, handleNoteOff]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      
      // Clean up active keys
      activeKeysRef.current.clear();
    };
  }, [handleKeyDown, handleKeyUp, handleWindowBlur]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (keyboardSourceRef.current) {
        keyboardSourceRef.current.stop();
      }
    };
  }, []);

  return {
    activeNote,
    activeNotes,
    startKeyboard,
    stopKeyboard,
    handleNoteOn,
    handleNoteOff,
    keyboardMapping: defaultMapping,
    keyboardSource: keyboardSourceRef.current,
    isKeyboardEnabled,
  };
}