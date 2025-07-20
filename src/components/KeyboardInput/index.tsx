import React from 'react';

interface KeyboardKey {
  note: string;
  octave: number;
  isSharp: boolean;
  keyBinding?: string;
}

interface KeyboardInputProps {
  activeNotes: string[];
  onNoteStart: (note: string, velocity: number, octave: number) => void;
  onNoteStop: (noteKey: string) => void;
  keyboardMapping: { [key: string]: string };
  className?: string;
}

export function KeyboardInput({ 
  activeNotes, 
  onNoteStart, 
  onNoteStop, 
  keyboardMapping,
  className = '' 
}: KeyboardInputProps) {
  // Create keyboard layout
  const createKeyboard = (): KeyboardKey[] => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaves = [3, 4, 5];
    const keys: KeyboardKey[] = [];

    // Find key binding for a note
    const findKeyBinding = (note: string, octave: number): string | undefined => {
      const noteKey = `${note}${octave === 4 ? '' : octave}`;
      return Object.entries(keyboardMapping).find(([_, mappedNote]) => 
        mappedNote === noteKey
      )?.[0];
    };

    octaves.forEach(octave => {
      notes.forEach(note => {
        keys.push({
          note,
          octave,
          isSharp: note.includes('#'),
          keyBinding: findKeyBinding(note, octave),
        });
      });
    });

    return keys;
  };

  const keys = createKeyboard();

  const handleMouseDown = (key: KeyboardKey) => {
    const noteKey = `${key.note}${key.octave}`;
    if (!activeNotes.includes(noteKey)) {
      onNoteStart(key.note, 0.7, key.octave);
    }
  };

  const handleMouseUp = (key: KeyboardKey) => {
    const noteKey = `${key.note}${key.octave}`;
    onNoteStop(noteKey);
  };

  const isActive = (key: KeyboardKey): boolean => {
    const noteKey = `${key.note}${key.octave}`;
    return activeNotes.includes(noteKey);
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-body-bold font-body-bold text-default-font">
          Virtual Keyboard
        </span>
        <span className="text-caption font-caption text-subtext-color">
          Use QWERTY keys or click to play
        </span>
      </div>

      {/* Octave sections */}
      <div className="flex gap-1 overflow-x-auto">
        {[3, 4, 5].map(octave => (
          <div key={octave} className="flex relative">
            {/* White keys */}
            <div className="flex">
              {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => {
                const key = keys.find(k => k.note === note && k.octave === octave)!;
                const noteKey = `${note}${octave}`;
                const active = isActive(key);
                
                return (
                  <div
                    key={noteKey}
                    className={`
                      w-8 h-24 border border-neutral-300 cursor-pointer transition-all duration-75
                      flex items-end justify-center pb-2 text-xs font-mono
                      ${active 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-white hover:bg-neutral-50 text-neutral-600'
                      }
                    `}
                    onMouseDown={() => handleMouseDown(key)}
                    onMouseUp={() => handleMouseUp(key)}
                    onMouseLeave={() => handleMouseUp(key)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px]">{note}</span>
                      {key.keyBinding && (
                        <span className="text-[8px] opacity-70">
                          {key.keyBinding.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Black keys overlay */}
            <div className="absolute top-0 left-0 flex">
              {['C#', 'D#', '', 'F#', 'G#', 'A#'].map((note, index) => {
                if (!note) {
                  return <div key={index} className="w-8" />;
                }

                const key = keys.find(k => k.note === note && k.octave === octave)!;
                const noteKey = `${note}${octave}`;
                const active = isActive(key);
                
                return (
                  <div
                    key={noteKey}
                    className={`
                      w-5 h-16 cursor-pointer transition-all duration-75 -ml-2.5 z-10
                      flex items-end justify-center pb-2 text-xs font-mono
                      ${active 
                        ? 'bg-brand-400 text-white' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      }
                    `}
                    onMouseDown={() => handleMouseDown(key)}
                    onMouseUp={() => handleMouseUp(key)}
                    onMouseLeave={() => handleMouseUp(key)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px]">{note.replace('#', '♯')}</span>
                      {key.keyBinding && (
                        <span className="text-[7px] opacity-70">
                          {key.keyBinding.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Octave labels */}
      <div className="flex gap-1">
        {[3, 4, 5].map(octave => (
          <div key={octave} className="flex justify-center" style={{ width: '224px' }}>
            <span className="text-caption font-caption text-subtext-color">
              Octave {octave}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}