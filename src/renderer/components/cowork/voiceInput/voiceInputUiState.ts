export interface CoworkVoiceRecordingUiStateInput {
  isLarge: boolean;
  isStreaming: boolean;
  isVoiceRecording: boolean;
  hasPromptText: boolean;
}

export interface CoworkVoiceRecordingUiState {
  showLargeVoiceRecordingLayout: boolean;
  shouldHideInputPlaceholder: boolean;
  showCenteredRecordingStatus: boolean;
  showFooterRecordingStatus: boolean;
  showLargeInputControls: boolean;
  showLargeModelSelector: boolean;
  showTaskStopButton: boolean;
}

export const getCoworkVoiceRecordingUiState = ({
  isLarge,
  isStreaming,
  isVoiceRecording,
  hasPromptText,
}: CoworkVoiceRecordingUiStateInput): CoworkVoiceRecordingUiState => {
  const showLargeVoiceRecordingLayout = isVoiceRecording && isLarge;

  return {
    showLargeVoiceRecordingLayout,
    shouldHideInputPlaceholder: showLargeVoiceRecordingLayout,
    showCenteredRecordingStatus: showLargeVoiceRecordingLayout && !hasPromptText,
    showFooterRecordingStatus: showLargeVoiceRecordingLayout && hasPromptText,
    showLargeInputControls: !showLargeVoiceRecordingLayout,
    showLargeModelSelector: !showLargeVoiceRecordingLayout,
    showTaskStopButton: isStreaming && !showLargeVoiceRecordingLayout,
  };
};
