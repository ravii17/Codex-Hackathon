import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useDisputes } from '../context/DisputeContext';

export const ToastNotification: React.FC = () => {
  const { toast, showToast } = useDisputes();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast-popup"
          initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed top-5 right-5 z-[9999] max-w-sm w-full p-4 rounded-lg bg-white border border-slate-200/80 flex items-start gap-3 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
        >
          {/* Amex themed border highlights */}
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg ${
            toast.type === 'error' ? 'bg-[#EF4444]' : toast.type === 'warning' ? 'bg-[#F5A623]' : 'bg-[#10B981]'
          }`} />
          
          <div className="pl-1 flex gap-3 w-full">
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#F5A623] shrink-0 mt-0.5" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-left">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">
                {toast.type === 'error' ? 'Error Alert' : toast.type === 'warning' ? 'Attention' : 'Success'}
              </h4>
              <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                {toast.message}
              </p>
            </div>
            
            <button 
              onClick={() => showToast(null)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
