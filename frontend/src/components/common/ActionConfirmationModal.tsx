import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';
import { ProposedAction } from '../../types/index.js';
import { api } from '../../services/api.js';

interface ActionConfirmationModalProps {
  action: ProposedAction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  action,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !action) return null;

  const handleApprove = async () => {
    try {
      setIsExecuting(true);
      setError(null);
      const res: any = await api.executeAiAction(action);
      setIsExecuting(false);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setIsExecuting(false);
      setError(err.message || 'Execution failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background-card border border-border-highlight rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-border bg-background-subtle flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary-500/20 text-primary-300">
                HUMAN-IN-THE-LOOP APPROVAL
              </span>
              <h3 className="text-base font-bold text-white mt-1">{action.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Consequence Diff */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {action.description}
          </p>

          <div className="p-3.5 rounded-xl bg-background-subtle border border-border space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Operation Details & Impact
            </div>
            <div className="text-xs font-mono text-slate-400 bg-background/50 p-2.5 rounded-lg border border-border/50 max-h-36 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(action.payload, null, 2)}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300/90 leading-relaxed">
              Applying this action will directly mutate event records, create database audit logs, and trigger real-time notifications to team members.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-background-subtle border-t border-border flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-background-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isExecuting}
            className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Action...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Execute</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
