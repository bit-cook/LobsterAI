import { describe, expect, test } from 'vitest';

import { getCoworkVoiceRecordingUiState } from './voiceInputUiState';

describe('getCoworkVoiceRecordingUiState', () => {
  test('keeps the normal controls visible outside recording mode', () => {
    expect(getCoworkVoiceRecordingUiState({
      isLarge: true,
      isStreaming: false,
      isVoiceRecording: false,
      hasPromptText: false,
    })).toEqual({
      showLargeVoiceRecordingLayout: false,
      shouldHideInputPlaceholder: false,
      showCenteredRecordingStatus: false,
      showFooterRecordingStatus: false,
      showLargeInputControls: true,
      showLargeModelSelector: true,
      showTaskStopButton: false,
    });
  });

  test('shows the task stop button only when not in the voice recording layout', () => {
    expect(getCoworkVoiceRecordingUiState({
      isLarge: true,
      isStreaming: true,
      isVoiceRecording: false,
      hasPromptText: false,
    }).showTaskStopButton).toBe(true);

    expect(getCoworkVoiceRecordingUiState({
      isLarge: true,
      isStreaming: true,
      isVoiceRecording: true,
      hasPromptText: false,
    }).showTaskStopButton).toBe(false);
  });

  test('centers the recording status and hides controls before text exists', () => {
    const state = getCoworkVoiceRecordingUiState({
      isLarge: true,
      isStreaming: false,
      isVoiceRecording: true,
      hasPromptText: false,
    });

    expect(state.shouldHideInputPlaceholder).toBe(true);
    expect(state.showCenteredRecordingStatus).toBe(true);
    expect(state.showFooterRecordingStatus).toBe(false);
    expect(state.showLargeInputControls).toBe(false);
    expect(state.showLargeModelSelector).toBe(false);
  });

  test('moves the recording status to the footer once text exists', () => {
    const state = getCoworkVoiceRecordingUiState({
      isLarge: true,
      isStreaming: false,
      isVoiceRecording: true,
      hasPromptText: true,
    });

    expect(state.shouldHideInputPlaceholder).toBe(true);
    expect(state.showCenteredRecordingStatus).toBe(false);
    expect(state.showFooterRecordingStatus).toBe(true);
    expect(state.showLargeInputControls).toBe(false);
    expect(state.showLargeModelSelector).toBe(false);
  });

  test('does not apply the large recording layout to compact inline inputs', () => {
    const state = getCoworkVoiceRecordingUiState({
      isLarge: false,
      isStreaming: true,
      isVoiceRecording: true,
      hasPromptText: false,
    });

    expect(state.showLargeVoiceRecordingLayout).toBe(false);
    expect(state.shouldHideInputPlaceholder).toBe(false);
    expect(state.showLargeInputControls).toBe(true);
    expect(state.showLargeModelSelector).toBe(true);
    expect(state.showTaskStopButton).toBe(true);
  });
});
