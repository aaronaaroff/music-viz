import React, { useState, useRef } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Button } from "@/ui/components/Button";
import { FeatherSave } from "@subframe/core";
import { Select } from "@/ui/components/Select";
import { FeatherMusic } from "@subframe/core";
import { FeatherSparkles } from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSkipBack } from "@subframe/core";
import { FeatherPlay } from "@subframe/core";
import { FeatherSkipForward } from "@subframe/core";
import { Slider } from "@/ui/components/Slider";
import { Tabs } from "@/ui/components/Tabs";
import { FeatherSettings } from "@subframe/core";
import { FeatherSliders } from "@subframe/core";
import { FeatherZap } from "@subframe/core";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { TextField } from "@/ui/components/TextField";
import { TextArea } from "@/ui/components/TextArea";
import { AudioSourceSelector } from "@/components/AudioSourceSelector";
import { AudioLevelMeter } from "@/components/AudioLevelMeter";
import { KeyboardInput } from "@/components/KeyboardInput";
import { useAudioManager } from "@/hooks/useAudioManager";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { AudioSourceType } from "@/audio/types";
import { FileSource } from "@/audio/sources/FileSource";
import { MicrophoneSource } from "@/audio/sources/MicrophoneSource";
import { KeyboardSource } from "@/audio/sources/KeyboardSource";

function MusicVizUpload() {
  const [currentSourceType, setCurrentSourceType] = useState<AudioSourceType>(AudioSourceType.FILE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keyboardSourceRef = useRef<KeyboardSource | null>(null);
  
  const { state, setSource, startAnalysis, stopAnalysis, setVolume } = useAudioManager();
  
  // Initialize keyboard source
  if (!keyboardSourceRef.current && typeof window !== 'undefined') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    keyboardSourceRef.current = new KeyboardSource(audioContext);
  }

  const { playNote, stopNote, getActiveNotes, getKeyboardMapping } = useKeyboardInput(
    keyboardSourceRef.current,
    currentSourceType === AudioSourceType.KEYBOARD
  );

  const handleSourceChange = async (sourceType: AudioSourceType) => {
    // Stop current analysis
    if (state.isPlaying) {
      stopAnalysis();
    }

    setCurrentSourceType(sourceType);
    
    if (typeof window === 'undefined') return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      switch (sourceType) {
        case AudioSourceType.FILE:
          // File source will be set when user uploads a file
          break;
          
        case AudioSourceType.MICROPHONE:
          const micSource = new MicrophoneSource(audioContext);
          const hasPermission = await micSource.requestPermission();
          if (hasPermission) {
            await setSource(micSource, sourceType);
          }
          break;
          
        case AudioSourceType.KEYBOARD:
          if (keyboardSourceRef.current) {
            await setSource(keyboardSourceRef.current, sourceType);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to set audio source:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileSource = new FileSource(audioContext);
      await fileSource.loadFile(file);
      await setSource(fileSource, AudioSourceType.FILE);
      setCurrentSourceType(AudioSourceType.FILE);
    } catch (error) {
      console.error('Failed to load audio file:', error);
    }
  };

  const handlePlayPause = async () => {
    if (state.isPlaying) {
      stopAnalysis();
    } else if (state.currentSource) {
      try {
        await startAnalysis();
      } catch (error) {
        console.error('Failed to start audio analysis:', error);
      }
    }
  };

  const activeNotes = getActiveNotes();
  const keyboardMapping = getKeyboardMapping();

  return (
    <DefaultPageLayout>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <span className="text-heading-1 font-heading-1 text-default-font">
              Create Visualization
            </span>
            <span className="text-body font-body text-subtext-color">
              Upload music and customize your visualization
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="neutral-secondary"
              icon={<FeatherSave />}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Save draft
            </Button>
            <Button
              variant="destructive-secondary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Share
            </Button>
          </div>
        </div>
        <div className="flex w-full grow shrink-0 basis-0 items-start gap-6">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6">
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
              <AudioSourceSelector
                currentSource={currentSourceType}
                onSourceChange={handleSourceChange}
              />
              
              {/* File Upload Section */}
              {currentSourceType === AudioSourceType.FILE && (
                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-brand-600 px-6 py-12">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div 
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FeatherMusic className="text-heading-1 font-heading-1 text-brand-700" />
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-body font-body text-default-font text-center">
                        Drop your audio file here or click to browse
                      </span>
                      <span className="text-caption font-caption text-subtext-color text-center">
                        Supports MP3, WAV up to 50MB
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Microphone Section */}
              {currentSourceType === AudioSourceType.MICROPHONE && (
                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-warning-600 px-6 py-12">
                  <FeatherMusic className="text-heading-1 font-heading-1 text-warning-700" />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-body font-body text-default-font text-center">
                      Microphone Input Active
                    </span>
                    <span className="text-caption font-caption text-subtext-color text-center">
                      Make sure to allow microphone access
                    </span>
                  </div>
                </div>
              )}

              {/* Keyboard Section */}
              {currentSourceType === AudioSourceType.KEYBOARD && (
                <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md border border-dashed border-success-600 px-6 py-12">
                  <KeyboardInput
                    activeNotes={activeNotes}
                    onNoteStart={playNote}
                    onNoteStop={stopNote}
                    keyboardMapping={keyboardMapping}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Visualization Preview
              </span>
              <div className="flex h-96 w-full flex-none items-center justify-center rounded-md bg-neutral-50">
                <FeatherSparkles className="text-heading-1 font-heading-1 text-subtext-color" />
              </div>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={<FeatherSkipBack />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <IconButton
                    icon={<FeatherPlay />}
                    onClick={handlePlayPause}
                  />
                  <IconButton
                    icon={<FeatherSkipForward />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                </div>
                <Slider
                  className="h-5 w-96 flex-none"
                  value={[0]}
                  onValueChange={(value: number[]) => {}}
                  onValueCommit={(value: number[]) => {}}
                />
                <span className="text-caption font-caption text-subtext-color">
                  0:00 / 3:45
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-80 flex-none flex-col items-start gap-6 self-stretch">
            <Tabs>
              <Tabs.Item active={true} icon={<FeatherSettings />}>
                Style
              </Tabs.Item>
              <Tabs.Item icon={<FeatherSliders />}>Effects</Tabs.Item>
              <Tabs.Item icon={<FeatherZap />}>Motion</Tabs.Item>
            </Tabs>
            <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4">
              <div className="flex w-full flex-col items-start gap-2">
                <span className="text-body-bold font-body-bold text-default-font">
                  Base Shape
                </span>
                <ToggleGroup value="" onValueChange={(value: string) => {}}>
                  <ToggleGroup.Item icon={null} value="38b4d88a">
                    Circle
                  </ToggleGroup.Item>
                  <ToggleGroup.Item icon={null} value="e14daa0b">
                    Bars
                  </ToggleGroup.Item>
                  <ToggleGroup.Item icon={null} value="0cc46a60">
                    Wave
                  </ToggleGroup.Item>
                </ToggleGroup>
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                <span className="text-body-bold font-body-bold text-default-font">
                  Color Theme
                </span>
                <Select
                  className="h-auto w-full flex-none"
                  label=""
                  placeholder="Select theme"
                  helpText=""
                  value={undefined}
                  onValueChange={(value: string) => {}}
                >
                  <Select.Item value="neon">neon</Select.Item>
                  <Select.Item value="sunset">sunset</Select.Item>
                  <Select.Item value="mono">mono</Select.Item>
                </Select>
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Sensitivity
                </span>
                <Slider
                  value={[50]}
                  onValueChange={(value: number[]) => {}}
                  onValueCommit={(value: number[]) => {}}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Smoothing
                </span>
                <Slider
                  value={[50]}
                  onValueChange={(value: number[]) => {}}
                  onValueCommit={(value: number[]) => {}}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Size Scale
                </span>
                <Slider
                  value={[50]}
                  onValueChange={(value: number[]) => {}}
                  onValueCommit={(value: number[]) => {}}
                />
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                <TextField
                  className="h-auto w-full flex-none"
                  label="Title"
                  helpText="Name your visualization"
                >
                  <TextField.Input
                    placeholder="My Visualization"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
              </div>
              <TextArea
                className="h-auto w-full flex-none"
                label="Description"
                helpText="Add details about your visualization"
              >
                <TextArea.Input
                  placeholder="Describe your visualization..."
                  value=""
                  onChange={(
                    event: React.ChangeEvent<HTMLTextAreaElement>
                  ) => {}}
                />
              </TextArea>
              
              {/* Audio Level Meter */}
              {state.isPlaying && (
                <AudioLevelMeter analysisData={state.analysisData} />
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default MusicVizUpload;