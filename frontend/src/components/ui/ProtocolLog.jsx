import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';

const STEPS = [
  { id: '01', label: 'DETECTING LOGIC TYPE...',         doneLabel: 'LOGIC TYPE IDENTIFIED'         },
  { id: '02', label: 'GENERATING ABT STRUCTURAL MAP...', doneLabel: 'STRUCTURAL MAP COMPLETE'       },
  { id: '03', label: 'CALCULATING SHA3 FINGERPRINT...',  doneLabel: 'SHA3 FINGERPRINT LOCKED'       },
  { id: '04', label: 'CHAINING TO AXIOM LEDGER...',      doneLabel: 'ENTRY COMMITTED TO LEDGER'    },
];

export default function ProtocolLog({ activeStep, isComplete, isError }) {
  // activeStep: 0-3 (which step is currently running), -1 = not started
  // isComplete: bool — all steps done successfully
  // isError: bool — something failed
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 font-mono text-sm space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
        <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
          {isError ? 'PROCESS FAILED' : isComplete ? 'PROCESS COMPLETE' : 'VOUCH ENGINE RUNNING'}
        </span>
      </div>

      {STEPS.map((step, index) => {
        const isDone = isComplete || (activeStep === -1 && isComplete) || index < activeStep;
        const isActive = index === activeStep && !isComplete && !isError;
        const isPending = index > activeStep && !isComplete;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.2 }}
            className="flex items-center gap-3"
          >
            <span className="text-gray-600 text-xs">[{step.id}]</span>
            {isDone ? (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            ) : isActive ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-gray-700 shrink-0" />
            )}
            <span className={`${isDone ? 'text-green-400' : isActive ? 'text-blue-300' : 'text-gray-600'}`}>
              {isDone ? step.doneLabel : step.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
