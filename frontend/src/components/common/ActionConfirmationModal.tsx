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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-[#EAEFF7] rounded-2xl shadow-2xl overflow-hidden z-10 animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-[#EAEFF7] bg-[#F4F5FB] flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-violet-100 text-violet-700">
                HUMAN-IN-THE-LOOP APPROVAL
              </span>
              <h3 className="text-base font-bold text-[#191E35] mt-1">{action.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#7A829D] hover:text-[#191E35] hover:bg-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Consequence Diff */}
        <div className="p-5 space-y-4 bg-white">
          <p className="text-sm text-[#191E35] leading-relaxed">
            {action.description}
          </p>

          <div className="p-3.5 rounded-xl bg-[#F4F5FB] border border-[#EAEFF7] space-y-2">
            <div className="text-xs font-semibold text-[#7A829D] uppercase tracking-wider">
              Operation Details &amp; Impact
            </div>
            <div className="text-xs font-mono text-[#191E35] bg-white p-2.5 rounded-lg border border-[#EAEFF7] max-h-36 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(action.payload, null, 2)}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 leading-relaxed">
              Applying this action will directly mutate event records, create database audit logs, and trigger real-time notifications to team members.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#F4F5FB] border-t border-[#EAEFF7] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A829D] hover:text-[#191E35] hover:bg-white border border-[#EAEFF7] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isExecuting}
            className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Action...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve &amp; Execute</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
