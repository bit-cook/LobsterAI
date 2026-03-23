import React, { useEffect, useState } from 'react';
import { agentService } from '../../services/agent';
import { i18nService } from '../../services/i18n';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Agent } from '../../types/agent';

interface AgentSettingsPanelProps {
  agentId: string | null;
  onClose: () => void;
}

const AgentSettingsPanel: React.FC<AgentSettingsPanelProps> = ({ agentId, onClose }) => {
  const [, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [identity, setIdentity] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    window.electron?.agents?.get(agentId).then((a) => {
      if (a) {
        setAgent(a);
        setName(a.name);
        setDescription(a.description);
        setSystemPrompt(a.systemPrompt);
        setIdentity(a.identity);
        setIcon(a.icon);
      }
    });
  }, [agentId]);

  if (!agentId) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await agentService.updateAgent(agentId, {
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        identity: identity.trim(),
        icon: icon.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const success = await agentService.deleteAgent(agentId);
    if (success) {
      onClose();
    }
  };

  const isMainAgent = agentId === 'main';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-xl shadow-xl bg-white dark:bg-claude-darkSurface border dark:border-claude-darkBorder border-claude-border max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-claude-darkBorder border-claude-border">
          <h3 className="text-base font-semibold dark:text-claude-darkText text-claude-text">
            {i18nService.t('agentSettings') || 'Agent Settings'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover">
            <XMarkIcon className="h-5 w-5 dark:text-claude-darkTextSecondary text-claude-textSecondary" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary mb-1">
              {i18nService.t('agentName') || 'Name'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🤖"
                className="w-12 px-2 py-2 text-center rounded-lg border dark:border-claude-darkBorder border-claude-border bg-transparent dark:text-claude-darkText text-claude-text text-lg"
                maxLength={4}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border dark:border-claude-darkBorder border-claude-border bg-transparent dark:text-claude-darkText text-claude-text text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary mb-1">
              {i18nService.t('agentDescription') || 'Description'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border dark:border-claude-darkBorder border-claude-border bg-transparent dark:text-claude-darkText text-claude-text text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary mb-1">
              {i18nService.t('systemPrompt') || 'System Prompt'}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border dark:border-claude-darkBorder border-claude-border bg-transparent dark:text-claude-darkText text-claude-text text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary mb-1">
              {i18nService.t('agentIdentity') || 'Identity'}
            </label>
            <textarea
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              rows={3}
              placeholder={i18nService.t('agentIdentityPlaceholder') || 'Identity description (IDENTITY.md)...'}
              className="w-full px-3 py-2 rounded-lg border dark:border-claude-darkBorder border-claude-border bg-transparent dark:text-claude-darkText text-claude-text text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t dark:border-claude-darkBorder border-claude-border">
          <div>
            {!isMainAgent && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                {i18nService.t('delete') || 'Delete'}
              </button>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">{i18nService.t('confirmDelete') || 'Confirm?'}</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600"
                >
                  {i18nService.t('delete') || 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs font-medium rounded dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover"
                >
                  {i18nService.t('cancel') || 'Cancel'}
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
            >
              {i18nService.t('cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-claude-accent text-white hover:bg-claude-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (i18nService.t('saving') || 'Saving...') : (i18nService.t('save') || 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSettingsPanel;
