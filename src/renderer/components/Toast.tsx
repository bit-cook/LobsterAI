import React from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border/60 bg-surface/95 text-foreground px-6 py-4 shadow-xl backdrop-blur-md animate-scale-in">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-full bg-primary/10 p-2.5">
            <InformationCircleIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-base font-medium leading-snug">
            {message}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 text-secondary hover:text-foreground rounded-full p-1 hover:bg-surface-raised transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toast;
