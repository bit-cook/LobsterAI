import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { agentService } from '../../services/agent';
import { coworkService } from '../../services/cowork';
import { i18nService } from '../../services/i18n';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AgentListProps {
  onCreateAgent: () => void;
  onAddPreset: () => void;
  onAgentSettings: (agentId: string) => void;
}

const AgentList: React.FC<AgentListProps> = ({
  onCreateAgent,
  onAddPreset,
  onAgentSettings,
}) => {
  const agents = useSelector((state: RootState) => state.agent.agents);
  const currentAgentId = useSelector((state: RootState) => state.agent.currentAgentId);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  useEffect(() => {
    agentService.loadAgents();
  }, []);

  const handleSwitchAgent = (agentId: string) => {
    if (agentId === currentAgentId) return;
    agentService.switchAgent(agentId);
    // Reload sessions for the new agent
    coworkService.loadSessions(agentId);
  };

  const enabledAgents = agents.filter((a) => a.enabled);

  // Don't render if only the default main agent exists
  if (enabledAgents.length <= 1 && !enabledAgents.some((a) => a.source === 'preset')) {
    return (
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="w-full inline-flex items-center gap-1.5 text-xs font-medium dark:text-claude-darkTextTertiary text-claude-textTertiary hover:text-claude-accent dark:hover:text-claude-accent transition-colors"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {i18nService.t('createAgent') || 'Create Agent'}
        </button>
        {showCreateMenu && (
          <CreateAgentMenu
            onCreateAgent={() => { setShowCreateMenu(false); onCreateAgent(); }}
            onAddPreset={() => { setShowCreateMenu(false); onAddPreset(); }}
            onClose={() => setShowCreateMenu(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-3 pb-2">
      <div className="text-xs font-medium dark:text-claude-darkTextSecondary text-claude-textSecondary mb-1.5">
        {i18nService.t('myAgents') || 'My Agents'}
      </div>
      <div className="space-y-0.5">
        {enabledAgents.map((agent) => (
          <div
            key={agent.id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors ${
              currentAgentId === agent.id
                ? 'bg-claude-accent/10 text-claude-accent'
                : 'dark:text-claude-darkTextSecondary text-claude-textSecondary hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover'
            }`}
            onClick={() => handleSwitchAgent(agent.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (agent.id !== 'main') {
                onAgentSettings(agent.id);
              }
            }}
          >
            <span className="text-base leading-none">{agent.icon || '🦞'}</span>
            <span className="truncate flex-1 text-xs font-medium">{agent.name}</span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="w-full inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium dark:text-claude-darkTextTertiary text-claude-textTertiary hover:text-claude-accent dark:hover:text-claude-accent hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {i18nService.t('createAgent') || 'Create Agent'}
        </button>
      </div>
      {showCreateMenu && (
        <CreateAgentMenu
          onCreateAgent={() => { setShowCreateMenu(false); onCreateAgent(); }}
          onAddPreset={() => { setShowCreateMenu(false); onAddPreset(); }}
          onClose={() => setShowCreateMenu(false)}
        />
      )}
    </div>
  );
};

const CreateAgentMenu: React.FC<{
  onCreateAgent: () => void;
  onAddPreset: () => void;
  onClose: () => void;
}> = ({ onCreateAgent, onAddPreset, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    // Delay listener registration to avoid catching the same click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return (
    <div
      className="mt-1 py-1 rounded-lg shadow-lg border dark:border-claude-darkBorder border-claude-border bg-white dark:bg-claude-darkSurface z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onCreateAgent}
        className="w-full px-3 py-1.5 text-left text-xs dark:text-claude-darkText text-claude-text hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
      >
        {i18nService.t('customCreate') || 'Custom Create'}
      </button>
      <button
        type="button"
        onClick={onAddPreset}
        className="w-full px-3 py-1.5 text-left text-xs dark:text-claude-darkText text-claude-text hover:bg-claude-surfaceHover dark:hover:bg-claude-darkSurfaceHover transition-colors"
      >
        {i18nService.t('choosePreset') || 'Choose Preset'}
      </button>
    </div>
  );
};

export default AgentList;
