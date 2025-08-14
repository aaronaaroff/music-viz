import { useState, useCallback } from 'react';
import { 
  VisualizationSettings, 
  VisualizationType, 
  ColorTheme, 
  DEFAULT_VISUALIZATION_SETTINGS 
} from '../visualizers/types';

export function useVisualization(initialSettings: Partial<VisualizationSettings> = {}) {
  const [settings, setSettings] = useState<VisualizationSettings>({
    ...DEFAULT_VISUALIZATION_SETTINGS,
    ...initialSettings,
  });

  const updateSettings = useCallback((newSettings: Partial<VisualizationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const setVisualizationType = useCallback((type: VisualizationType) => {
    updateSettings({ type });
  }, [updateSettings]);

  const setColorTheme = useCallback((colorTheme: ColorTheme) => {
    updateSettings({ colorTheme });
  }, [updateSettings]);

  const setSensitivity = useCallback((sensitivity: number) => {
    updateSettings({ sensitivity: Math.max(0, Math.min(1, sensitivity)) });
  }, [updateSettings]);

  const setSmoothing = useCallback((smoothing: number) => {
    updateSettings({ smoothing: Math.max(0, Math.min(1, smoothing)) });
  }, [updateSettings]);

  const setSizeScale = useCallback((sizeScale: number) => {
    updateSettings({ sizeScale: Math.max(0, Math.min(2, sizeScale)) });
  }, [updateSettings]);

  const setParticleCount = useCallback((particleCount: number) => {
    updateSettings({ particleCount: Math.max(8, Math.min(256, particleCount)) });
  }, [updateSettings]);

  const setGlowIntensity = useCallback((glowIntensity: number) => {
    updateSettings({ glowIntensity: Math.max(0, Math.min(1, glowIntensity)) });
  }, [updateSettings]);

  const setBackgroundOpacity = useCallback((backgroundOpacity: number) => {
    updateSettings({ backgroundOpacity: Math.max(0, Math.min(1, backgroundOpacity)) });
  }, [updateSettings]);

  const setRotationSpeed = useCallback((rotationSpeed: number) => {
    updateSettings({ rotationSpeed: Math.max(-2, Math.min(2, rotationSpeed)) });
  }, [updateSettings]);

  const togglePulseBeatSync = useCallback(() => {
    updateSettings({ pulseBeatSync: !settings.pulseBeatSync });
  }, [settings.pulseBeatSync, updateSettings]);

  const toggleFlashOnset = useCallback(() => {
    updateSettings({ flashOnset: !settings.flashOnset });
  }, [settings.flashOnset, updateSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_VISUALIZATION_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    setVisualizationType,
    setColorTheme,
    setSensitivity,
    setSmoothing,
    setSizeScale,
    setParticleCount,
    setGlowIntensity,
    setBackgroundOpacity,
    setRotationSpeed,
    togglePulseBeatSync,
    toggleFlashOnset,
    resetToDefaults,
  };
}