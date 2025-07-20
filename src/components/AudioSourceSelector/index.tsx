import React from 'react';
import { AudioSourceType } from '../../audio/types';
import type { AudioSourceType as AudioSourceTypeType } from '../../audio/types';
import { Select } from '@/ui/components/Select';
import { FeatherMusic, FeatherMic, FeatherKeyboard } from '@subframe/core';

interface AudioSourceSelectorProps {
  currentSource: AudioSourceTypeType;
  onSourceChange: (sourceType: AudioSourceTypeType) => void;
  className?: string;
}

export function AudioSourceSelector({ 
  currentSource, 
  onSourceChange, 
  className = '' 
}: AudioSourceSelectorProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <span className="text-heading-3 font-heading-3 text-default-font">
        Audio Source
      </span>
      
      <Select
        className="h-auto w-48 flex-none"
        label=""
        placeholder="Select source"
        helpText=""
        value={currentSource}
        onValueChange={(value: string) => onSourceChange(value as AudioSourceTypeType)}
      >
        <Select.Item value={AudioSourceType.FILE}>
          <div className="flex items-center gap-2">
            <FeatherMusic className="w-4 h-4" />
            <span>Upload File</span>
          </div>
        </Select.Item>
        <Select.Item value={AudioSourceType.MICROPHONE}>
          <div className="flex items-center gap-2">
            <FeatherMic className="w-4 h-4" />
            <span>Microphone</span>
          </div>
        </Select.Item>
        <Select.Item value={AudioSourceType.KEYBOARD}>
          <div className="flex items-center gap-2">
            <FeatherKeyboard className="w-4 h-4" />
            <span>Keyboard</span>
          </div>
        </Select.Item>
      </Select>
    </div>
  );
}