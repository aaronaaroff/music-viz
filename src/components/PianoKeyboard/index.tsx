import React, { useRef, useCallback, useEffect, useState } from 'react';

interface PianoKeyboardProps {
  activeNotes: string[];
  onNoteStart: (note: string, velocity: number, octave: number) => void;
  onNoteStop: (noteKey: string) => void;
  keyboardMapping: { [key: string]: string };
  keyboardSource?: any; // KeyboardSource instance
}

export function PianoKeyboard({ 
  activeNotes, 
  onNoteStart, 
  onNoteStop, 
  keyboardMapping,
  keyboardSource
}: PianoKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Play note using the KeyboardSource
  const playNote = useCallback((note: string) => {
    // Extract note name and octave
    const octave = parseInt(note.replace(/[A-G]#?/, ''));
    const noteName = note.replace(/\d+/, '');
    
    // Use KeyboardSource if available, otherwise call handlers directly
    if (keyboardSource && keyboardSource.playNote) {
      keyboardSource.playNote(noteName, 0.7, octave);
    }
    
    // Call the visualization handlers
    onNoteStart(noteName, 0.7, octave);
    
    // Visual feedback management
    const noteKey = `${note}-${Date.now()}`;
    setActiveKeys(prev => new Set([...prev, noteKey]));
    
    // For mouse clicks, auto-release after a short time
    setTimeout(() => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteKey);
        return newSet;
      });
    }, 300); // Visual feedback duration for mouse clicks
  }, [keyboardSource, onNoteStart]);

  // Keyboard event handlers (from remixed example)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't play piano if text input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      const note = keyboardMapping[e.key.toLowerCase()];
      if (note && !activeKeysRef.current.has(note)) {
        e.preventDefault();
        activeKeysRef.current.add(note);
        playNote(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keyboardMapping[e.key.toLowerCase()];
      if (note && activeKeysRef.current.has(note)) {
        activeKeysRef.current.delete(note);
        
        // Stop note in KeyboardSource if available
        if (keyboardSource && keyboardSource.stopNote) {
          keyboardSource.stopNote(note);
        }
        
        onNoteStop(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardMapping, playNote, onNoteStop, keyboardSource]);
  // Piano keys layout similar to remixed example
  const pianoKeys = [
    { note: 'C4', type: 'white', key: 'a' },
    { note: 'C#4', type: 'black', key: 'w' },
    { note: 'D4', type: 'white', key: 's' },
    { note: 'D#4', type: 'black', key: 'e' },
    { note: 'E4', type: 'white', key: 'd' },
    { note: 'F4', type: 'white', key: 'f' },
    { note: 'F#4', type: 'black', key: 't' },
    { note: 'G4', type: 'white', key: 'g' },
    { note: 'G#4', type: 'black', key: 'y' },
    { note: 'A4', type: 'white', key: 'h' },
    { note: 'A#4', type: 'black', key: 'u' },
    { note: 'B4', type: 'white', key: 'j' },
    { note: 'C5', type: 'white', key: 'k' },
    { note: 'C#5', type: 'black', key: 'o' },
    { note: 'D5', type: 'white', key: 'l' },
    { note: 'D#5', type: 'black', key: 'p' },
    { note: 'E5', type: 'white', key: ';' },
    { note: 'F5', type: 'white', key: "'" },
    { note: 'F#5', type: 'black', key: '[' },
    { note: 'G5', type: 'white', key: 'm' },
    { note: 'G#5', type: 'black', key: ']' },
    { note: 'A5', type: 'white', key: ',' },
    { note: 'A#5', type: 'black', key: '\\' },
    { note: 'B5', type: 'white', key: '.' },
    { note: 'C6', type: 'white', key: '/' }
  ];

  const handleMouseDown = (note: string) => {
    playNote(note);
  };

  const handleMouseUp = (note: string) => {
    // Stop note in KeyboardSource if available
    if (keyboardSource && keyboardSource.stopNote) {
      keyboardSource.stopNote(note);
    }
    onNoteStop(note);
  };

  const isActive = (note: string): boolean => {
    return activeNotes.includes(note);
  };

  return (
    <div className="relative bg-gray-200 p-2 rounded-lg shadow-sm w-full max-w-2xl">
      <div className="relative">
        {/* White keys */}
        <div className="flex">
          {pianoKeys.filter(key => key.type === 'white').map((key) => {
            const active = isActive(key.note);
            
            return (
              <button
                key={key.note}
                onMouseDown={() => handleMouseDown(key.note)}
                onMouseUp={() => handleMouseUp(key.note)}
                onMouseLeave={() => handleMouseUp(key.note)}
                className={`
                  w-12 h-32 border border-gray-300 rounded-b-md
                  hover:bg-gray-50 active:bg-gray-100
                  transition-all duration-300 flex flex-col justify-end items-center pb-2
                  ${active ? 'bg-success-700 border-success-600' : 'bg-white'}
                `}
              >
                <span className="text-xs text-gray-800 font-bold mb-1">
                  {key.key?.toUpperCase()}
                </span>
                <span className="text-[10px] text-gray-600 opacity-80">{key.note}</span>
              </button>
            );
          })}
        </div>

        {/* Black keys */}
        <div className="absolute top-0 left-0 flex">
          {pianoKeys.filter(key => key.type === 'black').map((key) => {
            const whiteKeyIndex = pianoKeys.filter(k => k.type === 'white' && 
              pianoKeys.indexOf(k) < pianoKeys.indexOf(key)).length;
            
            // Calculate position based on piano layout (adjusted for smaller keys)
            let leftOffset = (whiteKeyIndex * 48) - 18;
            
            const active = isActive(key.note);
            
            return (
              <button
                key={key.note}
                onMouseDown={() => handleMouseDown(key.note)}
                onMouseUp={() => handleMouseUp(key.note)}
                onMouseLeave={() => handleMouseUp(key.note)}
                style={{ 
                  position: 'absolute',
                  left: `${leftOffset + 3}px` 
                }}
                className={`
                  w-9 h-20 border border-gray-800 rounded-b-md shadow-xl text-white
                  hover:bg-gray-800 active:bg-gray-700
                  transition-all duration-300 flex flex-col justify-end items-center pb-2 z-10
                  ${active ? 'bg-success-200 border-success-600' : 'bg-black'}
                `}
              >
                <span className="text-[9px] font-bold bg-black bg-opacity-50 px-1 rounded text-white mb-0.5">
                  {key.key?.toUpperCase()}
                </span>
                <span className="text-[9px] opacity-75">{key.note}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}