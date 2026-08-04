import React, { useState, useRef } from 'react';
import { useDisputes, type DisputeFile } from '../context/DisputeContext';
import { 
  LayoutDashboard, CreditCard, PlusCircle, History, Bell, Settings, 
  Menu, X, Upload, FileText, Trash2, Eye, CheckCircle2, Plus, LogOut, BriefcaseBusiness,
  Cpu, AlertTriangle, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- CORE UI CONTROLS ---

export const Card: React.FC<{ hoverable?: boolean; premium?: boolean; children: React.ReactNode; className?: string; onClick?: () => void }> = 
({ hoverable = false, premium = false, children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`glass-panel rounded-lg p-6 transition-all duration-200 relative overflow-hidden ${
      hoverable ? 'hover:border-amex-blue/35 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] cursor-pointer' : ''
    } ${
      premium ? 'border-t-3 border-t-[#D4AF37]' : ''
    } ${className}`}
  >
    {children}
  </div>
);

// --- SKELETON LOADERS ---

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-skeleton rounded ${className}`} />
);

export const TableSkeleton: React.FC = () => (
  <Card className="p-0 overflow-hidden border-slate-200 bg-white">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left font-extrabold text-slate-400 uppercase tracking-widest">
            <th className="px-6 py-4"><Skeleton className="h-3.5 w-20" /></th>
            <th className="px-6 py-4"><Skeleton className="h-3.5 w-16" /></th>
            <th className="px-6 py-4 text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></th>
            <th className="px-6 py-4 text-center"><Skeleton className="h-3.5 w-16 mx-auto" /></th>
            <th className="px-6 py-4 text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {[1, 2, 3, 4, 5].map(i => (
            <tr key={i} className="bg-white">
              <td className="px-6 py-4.5"><Skeleton className="h-4 w-32" /></td>
              <td className="px-6 py-4.5"><Skeleton className="h-4 w-20" /></td>
              <td className="px-6 py-4.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
              <td className="px-6 py-4.5 text-center"><Skeleton className="h-5 w-20 rounded-full mx-auto" /></td>
              <td className="px-6 py-4.5 text-right"><Skeleton className="h-7 w-16 rounded-lg ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

export const CardSkeleton: React.FC = () => (
  <Card className="space-y-4 bg-white">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <div className="space-y-2 pt-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
  </Card>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="p-5 space-y-3 bg-white">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TableSkeleton />
      </div>
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

export const TimelineSkeleton: React.FC = () => (
  <Card className="p-6 bg-white space-y-6">
    <Skeleton className="h-4 w-1/4" />
    <div className="border-l-2 border-slate-200 pl-5 space-y-6 ml-2 relative">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="relative space-y-2">
          <span className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-slate-200" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  </Card>
);

export const WorkspaceSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
    <div className="xl:col-span-3 space-y-4">
      <Card className="p-5 space-y-4 bg-white">
        <Skeleton className="h-4 w-1/2" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="space-y-2 pt-2 border-t border-slate-100 first:border-0 first:pt-0">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        ))}
      </Card>
    </div>
    <div className="xl:col-span-6 space-y-4">
      <Card className="p-5 space-y-4 bg-white">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
    <div className="xl:col-span-3 space-y-4">
      <Card className="p-5 space-y-4 bg-white">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    </div>
  </div>
);

// --- EMPTY & ERROR STATES ---

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => (
  <Card className="py-12 px-6 text-center max-w-lg mx-auto bg-white border border-slate-200/60 shadow-sm flex flex-col items-center justify-center space-y-4">
    {icon ? (
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
        {icon}
      </div>
    ) : (
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
        <Info className="w-6 h-6" />
      </div>
    )}
    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h3>
    <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs">{description}</p>
    {actionLabel && onAction && (
      <Button variant="primary" size="sm" onClick={onAction} className="mt-2 font-bold uppercase tracking-wider text-[10px]">
        {actionLabel}
      </Button>
    )}
  </Card>
);

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ message, onRetry }) => (
  <Card className="p-6 bg-white border border-rose-200 shadow-[0_10px_20px_rgba(239,68,68,0.02)] space-y-4 max-w-md mx-auto text-left">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-[#EF4444] shrink-0 border border-rose-100">
        <AlertTriangle className="w-4.5 h-4.5" />
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Network Alert</h4>
        <p className="text-[9px] font-bold text-slate-400">Unable to complete request</p>
      </div>
    </div>
    <p className="text-xs font-semibold text-slate-650 leading-relaxed">
      {message}
    </p>
    {onRetry && (
      <div className="flex justify-end pt-2">
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          Retry Request
        </Button>
      </div>
    )}
  </Card>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'; size?: 'sm' | 'md' | 'lg' }> = 
({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center font-bold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#016FD0]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
  const variants = {
    primary: 'bg-[#016FD0] text-white border border-[#016FD0] hover:bg-[#005eb8]',
    secondary: 'bg-[#DFBA73] text-slate-950 border border-[#cba963] hover:bg-[#d1aa62]',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
    danger: 'bg-[#B91C1C] text-white border border-[#B91C1C] hover:bg-[#991B1B]',
    ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  };
  const sizes = { 
    sm: 'px-3.5 py-2 text-xs', 
    md: 'px-4.5 py-2.5 text-xs', 
    lg: 'px-5 py-3 text-sm' 
  };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

export const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toLowerCase();
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';
  
  if (s.includes('approved') || s === 'resolved') { 
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200'; 
    dot = 'bg-emerald-500'; 
  } else if (s.includes('reject')) { 
    bg = 'bg-rose-50 text-rose-700 border-rose-200'; 
    dot = 'bg-rose-500'; 
  } else if (s.includes('gathering') || s.includes('response') || s.includes('review') || s === 'submitted') { 
    bg = 'bg-sky-50 text-sky-700 border-sky-200'; 
    dot = 'bg-[#016FD0]'; 
  } else if (s.includes('appealed') || s.includes('warning')) { 
    bg = 'bg-amber-50 text-amber-700 border-amber-200'; 
    dot = 'bg-amber-500'; 
  }
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dot}`} />
      {status}
    </span>
  );
};

export const ProgressRing: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 64 }) => {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const strokeColor = percentage < 50 
    ? 'stroke-[#EF4444]' 
    : percentage < 80 
      ? 'stroke-[#F5A623]' 
      : 'stroke-[#10B981]';
      
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle className="stroke-slate-200 fill-none" strokeWidth={5} r={radius} cx={size/2} cy={size/2} />
        <motion.circle 
          className={`${strokeColor} fill-none`} 
          strokeWidth={5} 
          strokeLinecap="round" 
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} 
          animate={{ strokeDashoffset: offset }} 
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          r={radius} 
          cx={size/2} 
          cy={size/2} 
        />
      </svg>
      <span className="absolute text-[11px] font-black text-slate-900">{percentage}%</span>
    </div>
  );
};

// --- EVIDENCE UPLOAD MODULE ---

interface UploadZoneProps {
  files: DisputeFile[];
  onAddFiles: (newFiles: Omit<DisputeFile, 'id'>[]) => void;
  onRemoveFile: (id: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ files, onAddFiles, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<DisputeFile | null>(null);

  const checklist = [
    { id: 'receipt', label: 'Receipt uploaded', status: files.some(f => f.category === 'Receipts') },
    { id: 'proof', label: 'Transaction proof found', status: files.some(f => ['Invoices', 'Order Confirmation'].includes(f.category)) },
    { id: 'chat', label: 'Merchant communication log', status: files.some(f => f.category === 'Chat Logs') },
  ];

  const corePassed = checklist.filter(c => c.status).length;
  const completenessScore = corePassed === 0 ? 20 : corePassed === 1 ? 55 : corePassed === 2 ? 80 : 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(Array.from(e.target.files).map(f => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(0)} KB`,
        category: f.name.toLowerCase().includes('receipt') ? 'Receipts' : f.name.toLowerCase().includes('chat') ? 'Chat Logs' : 'Invoices'
      })));
    }
  };

  const addSampleFile = (type: 'receipt' | 'chat' | 'invoice' | 'refund') => {
    const samples = {
      receipt: { name: 'store_receipt_7231.png', size: '380 KB', category: 'Receipts' },
      chat: { name: 'merchant_chat_log.pdf', size: '1.2 MB', category: 'Chat Logs' },
      invoice: { name: 'invoice_2026_098.pdf', size: '540 KB', category: 'Invoices' },
      refund: { name: 'luxe_hotel_cancellation_refund_email_LH-92831.pdf', size: '620 KB', category: 'Merchant Email' }
    };
    onAddFiles([samples[type]]);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#016FD0]/50 rounded-lg p-8 text-center cursor-pointer bg-slate-50 hover:bg-white transition-colors group"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
            <Upload className="w-9 h-9 mx-auto text-[#016FD0] mb-3" />
            <p className="text-xs font-bold text-slate-800">Click or drag files here to upload</p>
            <p className="text-[10px] text-slate-500 mt-1">Supports PDF, PNG, JPG, DOCX (Max 10MB)</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-[9px] uppercase font-black text-slate-500 block mb-2.5 tracking-widest">Demo File Shortcut</span>
            <div className="flex flex-wrap gap-2">
              {(['receipt', 'chat', 'invoice', 'refund'] as const).map(type => (
                <button key={type} type="button" onClick={() => addSampleFile(type)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:border-[#016FD0] hover:text-[#016FD0] transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map(file => (
                <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#016FD0] shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[9px] text-slate-400">{file.size} • {file.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setPreviewFile(file)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"><Eye className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onRemoveFile(file.id)} className="p-1.5 text-slate-400 hover:text-[#EF4444] hover:bg-rose-500/10 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#016FD0]"><span className="font-extrabold uppercase tracking-wide">Evidence Review</span></div>
          <div className="flex flex-col items-center py-3 border-b border-slate-200">
            <ProgressRing percentage={completenessScore} size={80} />
            <span className="text-xs font-extrabold text-slate-800 mt-3">Evidence Quality</span>
          </div>
          <div className="space-y-3">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-2.5 text-xs">
                <CheckCircle2 className={`w-4 h-4 shrink-0 transition-colors ${item.status ? 'text-[#10B981]' : 'text-slate-700'}`} />
                <span className={item.status ? 'text-slate-500 line-through' : 'text-slate-700 font-semibold'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="glass-panel border border-slate-200 rounded-lg max-w-sm w-full p-6 relative shadow-2xl">
            <button className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer" onClick={() => setPreviewFile(null)}><X className="w-4 h-4" /></button>
            <h4 className="text-xs font-black text-slate-900 mb-1">{previewFile.name}</h4>
            <p className="text-[10px] text-slate-400 mb-4">{previewFile.category}</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center font-mono text-[9px] text-slate-500 h-32 flex items-center justify-center">
              [SECURE AMEX ENCRYPTED DOCUMENT PREVIEW]
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP LAYOUT (HEADER, SIDEBAR, UTILITIES) ---

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentPage, setCurrentPage, notifications, logout, currentRole, investigatorFilter, setInvestigatorFilter, customerName } = useDisputes();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = currentRole === 'investigator' ? [
    { id: 'investigator-overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'investigator-queue', label: 'Case Queue', icon: BriefcaseBusiness },
    { id: 'investigator-ai', label: 'AI Investigations', icon: Cpu },
    { id: 'investigator-escalations', label: 'Escalations', icon: AlertTriangle },
    { id: 'investigator-audit', label: 'Audit Log', icon: History },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'raise-dispute', label: 'Raise Dispute', icon: PlusCircle },
    { id: 'my-disputes', label: 'My Disputes', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'investigator-overview' || id === 'investigator-queue') {
      setInvestigatorFilter('All');
      setCurrentPage('investigator');
    } else if (id === 'investigator-ai') {
      setInvestigatorFilter('AI Ready');
      setCurrentPage('investigator');
    } else if (id === 'investigator-escalations') {
      setInvestigatorFilter('Escalated');
      setCurrentPage('investigator');
    } else if (id === 'investigator-audit') {
      setInvestigatorFilter('Under Review');
      setCurrentPage('investigator');
    } else {
      setCurrentPage(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer"><Menu className="w-5.5 h-5.5" /></button>
          
          <div onClick={() => handleNavClick(currentRole === 'investigator' ? 'investigator-overview' : 'dashboard')} className="flex items-center gap-3 cursor-pointer select-none group">
            <div className="w-9 h-9 bg-[#016FD0] flex flex-col justify-between p-1.5 rounded border border-[#005eb8]">
              <span className="text-[5px] font-black text-white leading-none tracking-widest">AMER</span>
              <span className="text-[5px] font-black text-white leading-none text-right tracking-widest self-end">EXPR</span>
            </div>
            <div className="flex flex-col">
              <span className="hidden sm:inline text-xs font-black text-slate-950 tracking-[0.15em] uppercase">AMERICAN EXPRESS</span>
              <span className="hidden sm:inline text-[9px] font-bold text-slate-500 leading-none">
                {currentRole === 'investigator' ? 'Resolve AI Agent Workspace' : 'Dispute Resolution Portal'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={logout}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button className="p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-full cursor-pointer relative" onClick={() => setCurrentPage(currentRole === 'investigator' ? 'investigator' : 'notifications')}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-white" />}
          </button>
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-[#016FD0] border border-[#005eb8] flex items-center justify-center font-black text-xs text-white">
              {currentRole === 'investigator' ? 'INV' : customerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-700">
              {currentRole === 'investigator' ? 'Amex Investigator' : customerName}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0 justify-between">
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              let active = currentPage === item.id || (item.id === 'my-disputes' && currentPage === 'appeal');
              if (currentRole === 'investigator') {
                if (item.id === 'investigator-overview' || item.id === 'investigator-queue') {
                  active = currentPage === 'investigator' && investigatorFilter === 'All';
                } else if (item.id === 'investigator-ai') {
                  active = currentPage === 'investigator' && investigatorFilter === 'AI Ready';
                } else if (item.id === 'investigator-escalations') {
                  active = currentPage === 'investigator' && investigatorFilter === 'Escalated';
                } else if (item.id === 'investigator-audit') {
                  active = currentPage === 'investigator' && investigatorFilter === 'Under Review';
                }
              }

              return (
                <button key={item.id} onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    active 
                      ? 'bg-[#eaf4ff] text-[#005eb8] border-l-3 border-l-[#016FD0] pl-2.5' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-colors ${active ? 'text-[#005eb8]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <span className="bg-[#EF4444] text-white text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-wide">{item.badge}</span>}
                </button>
              );
            })}
          </nav>

          <div className="relative overflow-hidden bg-slate-100 text-slate-800 p-5 rounded-lg space-y-5 border border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-[8px] tracking-[0.2em] font-extrabold text-slate-700">PLATINUM</span>
              <span className="text-[10px] font-serif font-black italic text-slate-900 tracking-tighter">AMEX</span>
            </div>
            <div className="w-8 h-6 rounded-md bg-[#DFBA73] border border-[#C5A059] opacity-90 p-0.5 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-0.5 h-full opacity-60">
                <div className="border-r border-slate-950/20" />
                <div className="border-r border-slate-950/20" />
                <div />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-700">•••• 91008</span>
              <span className="text-[8px] font-bold text-slate-600">MEMBER SINCE 18</span>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex flex-col w-60 bg-slate-900/95 border-r border-slate-200 h-full p-5 shadow-2xl z-10">
              <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-200">
                <span className="text-xs font-black tracking-wide text-white uppercase">American Express</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <nav className="space-y-1.5 flex-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  let active = currentPage === item.id;
                  if (currentRole === 'investigator') {
                    if (item.id === 'investigator-overview' || item.id === 'investigator-queue') {
                      active = currentPage === 'investigator' && investigatorFilter === 'All';
                    } else if (item.id === 'investigator-ai') {
                      active = currentPage === 'investigator' && investigatorFilter === 'AI Ready';
                    } else if (item.id === 'investigator-escalations') {
                      active = currentPage === 'investigator' && investigatorFilter === 'Escalated';
                    } else if (item.id === 'investigator-audit') {
                      active = currentPage === 'investigator' && investigatorFilter === 'Under Review';
                    }
                  }

                  return (
                    <button key={item.id} onClick={() => { handleNavClick(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                        active 
                          ? 'bg-[#016FD0]/20 text-[#38BDF8] border-l-3 border-l-[#016FD0] pl-2' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}>
                      <div className="flex items-center gap-2.5"><Icon className="w-4 h-4" /><span>{item.label}</span></div>
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-slate-200 pt-4">
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

