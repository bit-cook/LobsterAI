import React, { useEffect, useState } from 'react';
import { agentService } from '../../services/agent';
import { i18nService } from '../../services/i18n';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PresetAgent } from '../../types/agent';

interface AgentPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgentPresetModal: React.FC<AgentPresetModalProps> = ({ isOpen, onClose }) => {
  const [presets, setPresets] = useState<PresetAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    agentService.getPresets().then((result) => {
      setPresets(result);
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddPreset = async (presetId: string) => {
    setAdding(presetId);
    try {
      const agent = await agentService.addPreset(presetId);
      if (agent) {
        agentService.switchAgent(agent.id);
        onClose();
      }
    } finally {
      setAdding(null);
    }
  };

  const availablePresets = presets.filter((p) => !p.installed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-xl shadow-xl bg-white dark:bg-claude-darkSurface border dark:border-claude-darkBorder border-claude-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-claude-darkBorder border-claude-border">
          <h3 className="text-base font-semibold dark:text-claude-darkText text-claude-text">
            {i18nService.t('choosePreset') || 'Choose Preset'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover">
            <XMarkIcon className="h-5 w-5 dark:text-claude-darkTextSecondary text-claude-textSecondary" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center text-sm dark:text-claude-darkTextTertiary text-claude-textTertiary py-8">
              {i18nService.t('loading') || 'Loading...'}
            </div>
          ) : availablePresets.length === 0 ? (
            <div className="text-center text-sm dark:text-claude-darkTextTertiary text-claude-textTertiary py-8">
              {i18nService.t('noPresetsAvailable') || 'All presets have been added'}
            </div>
          ) : (
            <div className="space-y-2">
              {availablePresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-3 p-3 rounded-lg border dark:border-claude-darkBorder border-claude-border hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium dark:text-claude-darkText text-claude-text">{preset.name}</div>
                    <div className="text-xs dark:text-claude-darkTextTertiary text-claude-textTertiary truncate">{preset.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddPreset(preset.id)}
                    disabled={adding === preset.id}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-claude-accent text-white hover:bg-claude-accent/90 disabled:opacity-50 transition-colors"
                  >
                    {adding === preset.id ? '...' : (i18nService.t('add') || 'Add')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end px-5 py-4 border-t dark:border-claude-darkBorder border-claude-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
          >
            {i18nService.t('close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPresetModal;
