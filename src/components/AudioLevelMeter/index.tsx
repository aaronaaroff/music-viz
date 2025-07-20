import React from 'react';
import type { AudioAnalysisData } from '../../audio/types';

interface AudioLevelMeterProps {
  analysisData: AudioAnalysisData | null;
  className?: string;
}

export function AudioLevelMeter({ analysisData, className = '' }: AudioLevelMeterProps) {
  const volume = analysisData?.volume || 0;
  const bassEnergy = analysisData?.bassEnergy || 0;
  const midEnergy = analysisData?.midEnergy || 0;
  const highEnergy = analysisData?.highEnergy || 0;

  const volumePercentage = Math.min(volume * 100, 100);
  const bassPercentage = Math.min(bassEnergy * 100, 100);
  const midPercentage = Math.min(midEnergy * 100, 100);
  const highPercentage = Math.min(highEnergy * 100, 100);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <span className="text-body-bold font-body-bold text-default-font">
        Audio Levels
      </span>
      
      {/* Main Volume */}
      <div className="flex items-center gap-3">
        <span className="text-caption font-caption text-subtext-color w-12">
          Vol
        </span>
        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-600 transition-all duration-75 ease-out"
            style={{ width: `${volumePercentage}%` }}
          />
        </div>
        <span className="text-caption font-caption text-subtext-color w-8 text-right">
          {Math.round(volumePercentage)}
        </span>
      </div>

      {/* Frequency Bands */}
      <div className="grid grid-cols-3 gap-2">
        {/* Bass */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-caption font-caption text-subtext-color">
            Bass
          </span>
          <div className="w-4 h-16 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="w-full bg-error-600 transition-all duration-75 ease-out"
              style={{ 
                height: `${bassPercentage}%`,
                transform: `translateY(${100 - bassPercentage}%)`
              }}
            />
          </div>
        </div>

        {/* Mid */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-caption font-caption text-subtext-color">
            Mid
          </span>
          <div className="w-4 h-16 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="w-full bg-warning-600 transition-all duration-75 ease-out"
              style={{ 
                height: `${midPercentage}%`,
                transform: `translateY(${100 - midPercentage}%)`
              }}
            />
          </div>
        </div>

        {/* High */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-caption font-caption text-subtext-color">
            High
          </span>
          <div className="w-4 h-16 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="w-full bg-success-600 transition-all duration-75 ease-out"
              style={{ 
                height: `${highPercentage}%`,
                transform: `translateY(${100 - highPercentage}%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Beat Detection Indicator */}
      {analysisData?.beat && (
        <div className="flex items-center justify-center">
          <div className="w-3 h-3 bg-brand-600 rounded-full animate-pulse" />
          <span className="ml-2 text-caption font-caption text-brand-600">
            Beat Detected
          </span>
        </div>
      )}
    </div>
  );
}