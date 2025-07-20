import React, { useRef, useEffect, useState } from 'react';
import type { AudioAnalysisData } from '../audio/types';
import { VisualizationEngine, VisualizationSettings, VisualizationType } from './types';
import { CircleVisualizer } from './engines/CircleVisualizer';
import { BarsVisualizer } from './engines/BarsVisualizer';
import { WaveVisualizer } from './engines/WaveVisualizer';

interface VisualizationCanvasProps {
  audioData: AudioAnalysisData | null;
  settings: VisualizationSettings;
  isPlaying: boolean;
  className?: string;
}

export function VisualizationCanvas({ 
  audioData, 
  settings, 
  isPlaying, 
  className = '' 
}: VisualizationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<VisualizationEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize visualization engine
  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup existing engine
    if (engineRef.current) {
      engineRef.current.cleanup();
      engineRef.current = null;
    }

    // Create new engine based on visualization type
    switch (settings.type) {
      case VisualizationType.CIRCLE:
        engineRef.current = new CircleVisualizer(canvasRef.current, settings);
        break;
      case VisualizationType.BARS:
        engineRef.current = new BarsVisualizer(canvasRef.current, settings);
        break;
      case VisualizationType.WAVE:
        engineRef.current = new WaveVisualizer(canvasRef.current, settings);
        break;
      default:
        engineRef.current = new CircleVisualizer(canvasRef.current, settings);
    }

    setIsInitialized(true);

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, [settings.type]); // Only recreate engine when type changes

  // Update settings
  useEffect(() => {
    if (engineRef.current && isInitialized) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings, isInitialized]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !engineRef.current || !audioData) {
      // Stop animation when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      if (engineRef.current && audioData && isPlaying) {
        engineRef.current.render(audioData);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, audioData]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        // Trigger canvas setup on resize
        const rect = canvasRef.current.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        canvasRef.current.width = rect.width * devicePixelRatio;
        canvasRef.current.height = rect.height * devicePixelRatio;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        
        canvasRef.current.style.width = rect.width + 'px';
        canvasRef.current.style.height = rect.height + 'px';
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial size setup
    setTimeout(handleResize, 0);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full rounded-md ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    />
  );
}