import React, { useState, useMemo } from 'react';
import { useDisputes, type Transaction } from '../context/DisputeContext';
import { Card, Button, StatusChip, UploadZone } from './PortalUI';
import { 
  Search, ArrowRight, ArrowLeft, CheckCircle2, ChevronRight, 
  Scale, AlertCircle, Lock, RotateCcw, Database, Upload
} from 'lucide-react';

// ==========================================
// 1. DASHBOARD PAGE
// ==========================================

export const Dashboard: React.FC = () => {
  const { setCurrentPage, disputes, transactions, setActiveDisputeId, logout } = useDisputes();

  const stats = {
    total: disputes.length,
    active: disputes.filter(d => !['Resolved', 'Rejected'].includes(d.status)).length,
    resolved: disputes.filter(d => d.status === 'Resolved').length,
    pending: disputes.filter(d => d.status === 'Merchant Response').length
  };

  const handleTrackCase = (id: string) => {
    setActiveDisputeId(id);
    setCurrentPage('my-disputes');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Welcome Banner */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 bg-white border-slate-200">
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-[#016FD0] uppercase tracking-widest block">Cardmember Services</span>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Welcome Back, David</h1>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed font-medium">Track your existing claims, upload verification evidence, and appeal charge decisions directly from your secure member console.</p>
        </div>
        <div className="flex gap-2.5 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={logout} className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-bold">
            Sign In Page
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage('my-disputes')}>Track Cases</Button>
          <Button variant="primary" size="sm" onClick={() => setCurrentPage('transactions')}>New Dispute</Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Disputes', val: stats.total, sub: 'All-time filings' },
          { label: 'Active Cases', val: stats.active, sub: 'Under investigation' },
          { label: 'Resolved Cases', val: stats.resolved, sub: 'Refunds finalized' },
          { label: 'Pending Merchant', val: stats.pending, sub: 'Waiting SLA window' }
        ].map(item => (
          <Card key={item.label} hoverable className="p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#016FD0]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">{item.label}</span>
            <div className="text-3xl font-black text-slate-950 mt-2.5 tracking-tight">{item.val}</div>
            <span className="text-[10px] text-slate-500 block mt-1.5 font-medium">{item.sub}</span>
          </Card>
        ))}
      </div>

      {/* Activity Timeline & Active Claims list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My Disputes Active List */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">My Active Disputes</h3>
                <p className="text-[10px] text-slate-500">Currently pending dispute records</p>
              </div>
              <button onClick={() => setCurrentPage('my-disputes')} className="text-xs font-bold text-[#38BDF8] hover:underline cursor-pointer">View all</button>
            </div>

            <div className="divide-y divide-slate-200">
              {disputes.filter(d => d.status !== 'Resolved').map(d => (
                <div key={d.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-800 font-mono tracking-wide">{d.id}</span>
                      <StatusChip status={d.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">{d.transaction.merchant} • <b className="text-slate-950">${d.transaction.amount.toFixed(2)}</b></p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleTrackCase(d.id)} className="text-[10px] py-1">Track</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Transactions Quick Access */}
          <Card>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Recent Statement Transactions</h3>
                <p className="text-[10px] text-slate-500">Select posted charges to dispute</p>
              </div>
              <button onClick={() => setCurrentPage('transactions')} className="text-xs font-bold text-[#38BDF8] hover:underline cursor-pointer">View statement</button>
            </div>
            
            <div className="divide-y divide-slate-200 text-xs font-medium">
              {transactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="py-3.5 flex justify-between items-center group">
                  <div>
                    <p className="font-extrabold text-slate-900">{tx.merchant}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{tx.date} • {tx.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-950">${tx.amount.toFixed(2)}</span>
                    {tx.disputeEligible ? (
                      <button onClick={() => { setCurrentPage('transactions'); }} className="text-[#38BDF8] font-bold hover:underline cursor-pointer">Dispute</button>
                    ) : (
                      <span className="text-slate-600 font-bold">Locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right timeline info column */}
        <div className="space-y-4">
          <Card className="h-full">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide mb-6">System Alerts & Timeline</h3>
            <div className="relative border-l border-slate-200 pl-4 space-y-6 ml-1.5">
              {[
                { title: 'Best Buy Dispute Acknowledged', time: 'Today', desc: 'Temporary dispute credit has been posted.', color: 'bg-[#016FD0] ' },
                { title: 'Evidence Review Completed', time: 'Yesterday', desc: 'Invoice uploaded, completeness rating at 82%.', color: 'bg-[#10B981] ' },
                { title: 'Target Case Decisions Prepared', time: 'June 25', desc: 'Case was rejected. Appeal window is open.', color: 'bg-[#EF4444] ' }
              ].map(act => (
                <div key={act.title} className="relative text-xs">
                  <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${act.color}`} />
                  <p className="font-bold text-slate-800">{act.title} <span className="text-[9px] text-slate-500 font-normal">({act.time})</span></p>
                  <p className="text-slate-500 mt-1 leading-normal font-medium">{act.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. TRANSACTIONS LEDGER PAGE
// ==========================================

export const Transactions: React.FC = () => {
  const { transactions, setCurrentPage, setSelectedTransactionForDispute, setActiveDisputeId } = useDisputes();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => t.merchant.toLowerCase().includes(search.toLowerCase()));
  }, [transactions, search]);

  const handleDispute = (tx: Transaction) => {
    setSelectedTransactionForDispute(tx);
    setCurrentPage('raise-dispute');
  };

  const handleTrack = (id: string) => {
    setActiveDisputeId(id);
    setCurrentPage('my-disputes');
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">Statement Ledger</h1>
        <p className="text-xs text-slate-500 mt-1">Search posted card charges and select dispute options.</p>
      </div>

      <Card className="p-4 bg-white">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text" placeholder="Search merchant..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-slate-200 bg-white text-xs rounded-xl outline-none focus:border-[#016FD0] focus:ring-1 focus:ring-[#016FD0]/50 w-full placeholder-slate-500 text-slate-800 font-semibold"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left font-extrabold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Merchant</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-white transition-colors">
                  <td className="px-6 py-4.5 font-bold text-slate-900">{tx.merchant}</td>
                  <td className="px-6 py-4.5 text-slate-500">{tx.date}</td>
                  <td className="px-6 py-4.5 text-right font-black text-slate-950">${tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      tx.status === 'Pending' 
                        ? 'bg-amber-500/10 text-amber-400' 
                        : tx.status === 'Disputed' 
                          ? 'bg-sky-500/10 text-sky-400' 
                          : 'bg-slate-50 text-slate-500'
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    {tx.disputeEligible ? (
                      <Button variant="primary" size="sm" onClick={() => handleDispute(tx)} className="text-[10px] py-1 font-bold">Dispute</Button>
                    ) : tx.status === 'Disputed' && tx.disputeId ? (
                      <Button variant="outline" size="sm" onClick={() => handleTrack(tx.disputeId!)} className="text-[10px] py-1 font-bold">Track Case</Button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uncleared</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ==========================================
// 3. RAISE DISPUTE WIZARD PAGE
// ==========================================

export const DisputeWizard: React.FC = () => {
  const { selectedTransactionForDispute, setSelectedTransactionForDispute, setCurrentPage, createDispute, setActiveDisputeId } = useDisputes();
  const [step, setStep] = useState(1);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  // Form States
  const [reason, setReason] = useState('');
  const [contacted, setContacted] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<any[]>([]);

  if (!selectedTransactionForDispute && !submittedCaseId) {
    return (
      <Card className="max-w-md mx-auto py-12 text-center space-y-5">
        <AlertCircle className="w-12 h-12 mx-auto text-[#016FD0]  rounded-full p-0.5" />
        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">No Transaction Selected</h2>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">Please select an eligible transaction from your statement history to initiate a dispute claim.</p>
        <Button variant="primary" size="sm" onClick={() => setCurrentPage('transactions')}>View Transactions</Button>
      </Card>
    );
  }

  const handleNext = () => setStep(prev => Math.min(5, prev + 1));
  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const handleAddFiles = (newFiles: any[]) => {
    setFiles(prev => [...prev, ...newFiles.map((f, i) => ({ id: `f-${Date.now()}-${i}`, ...f }))]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = () => {
    if (!selectedTransactionForDispute) return;
    const codes: Record<string, string> = { 'Unauthorized Transaction': '4554', 'Item Not Received': '4512', 'Charged Twice': '4540', 'Defective Product': '4555' };
    const caseId = createDispute({
      transaction: selectedTransactionForDispute,
      reason: reason || 'Other Billing Discrepancy',
      mappedCode: codes[reason] || '4599',
      status: 'Submitted',
      questionnaire: { contactedMerchant: contacted, additionalInfo: notes },
      evidenceFiles: files,
      completenessScore: 82
    });
    setSubmittedCaseId(caseId);
  };

  const handleTrack = () => {
    if (submittedCaseId) {
      setActiveDisputeId(submittedCaseId);
      setSelectedTransactionForDispute(null);
      setCurrentPage('my-disputes');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      {!submittedCaseId && (
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-950 tracking-tight">Filing Card Member Dispute</h1>
            <p className="text-xs text-slate-500 mt-0.5">{selectedTransactionForDispute?.merchant} • ${selectedTransactionForDispute?.amount.toFixed(2)}</p>
          </div>
          <button onClick={() => { setSelectedTransactionForDispute(null); setCurrentPage('transactions'); }} className="text-xs font-bold text-slate-500 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Cancel</button>
        </div>
      )}

      {submittedCaseId ? (
        <Card className="text-center max-w-md mx-auto py-8 p-6 space-y-6">
          <div className="w-16 h-16 bg-[#10B981]/15 text-[#10B981] rounded-full flex items-center justify-center mx-auto border border-[#10B981]/30 ">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950 uppercase tracking-wide">Dispute Lodged Successfully</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">American Express temporary billing credits are now active on your statement and protected under billing policy.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 grid grid-cols-2 text-left gap-4">
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Case ID</span>
              <p className="text-xs font-mono font-black text-[#38BDF8] mt-0.5">{submittedCaseId}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">SLA Window</span>
              <p className="text-xs font-bold text-[#10B981] mt-0.5">5 Business Days</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <Button variant="primary" className="w-full text-xs font-bold py-3" onClick={handleTrack}>Track Dispute</Button>
            <Button variant="outline" className="w-full text-xs font-bold py-3" onClick={() => { setSelectedTransactionForDispute(null); setCurrentPage('dashboard'); }}>Return Dashboard</Button>
          </div>
        </Card>
      ) : (
        <Card className="space-y-8">
          {/* Custom Stepper */}
          <div className="flex items-center justify-between mb-8 max-w-lg mx-auto">
            {[1, 2, 3, 4, 5].map(s => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                    step === s 
                      ? 'bg-[#016FD0] text-slate-950 ' 
                      : step > s 
                        ? 'bg-[#10B981] text-slate-950 ' 
                        : 'bg-slate-800 text-slate-500 border border-slate-200'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className="text-[9px] font-black text-slate-500 mt-2 absolute top-8 whitespace-nowrap uppercase tracking-wider">
                    {s === 1 ? 'Verify' : s === 2 ? 'Reason' : s === 3 ? 'Details' : s === 4 ? 'Evidence' : 'Review'}
                  </span>
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                    step > s ? 'bg-[#10B981]' : 'bg-slate-850'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1: Details */}
          {step === 1 && selectedTransactionForDispute && (
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Step 1: Verify Billing Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs font-semibold">
                <div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider block mb-1">Merchant</span>
                  <p className="font-extrabold text-slate-900">{selectedTransactionForDispute.merchant}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider block mb-1">Amount</span>
                  <p className="font-extrabold text-slate-900">${selectedTransactionForDispute.amount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider block mb-1">Date</span>
                  <p className="font-bold text-slate-700">{selectedTransactionForDispute.date}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider block mb-1">Reference</span>
                  <p className="font-mono text-slate-500">{selectedTransactionForDispute.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Classification */}
          {step === 2 && (
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Step 2: Choose Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Unauthorized Transaction', 'Item Not Received', 'Charged Twice', 'Defective Product', 'Other'].map(r => (
                  <div key={r} onClick={() => setReason(r)}
                    className={`p-4 border rounded-lg cursor-pointer hover:border-[#016FD0]/40 transition-all ${
                      reason === r 
                        ? 'border-[#016FD0] bg-[#016FD0]/5 shadow-[inset_0_0_12px_rgba(1,111,208,0.15)]' 
                        : 'border-slate-200 bg-white'
                    }`}>
                    <span className={`text-xs font-bold ${reason === r ? 'text-slate-950' : 'text-slate-700'}`}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Form questions */}
          {step === 3 && (
            <div className="space-y-5 pt-4 max-w-md">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Step 3: Details Questionnaire</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-black text-slate-700 block mb-2 uppercase tracking-wide">Did you try contacting the merchant?</label>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map(v => (
                      <button key={v} type="button" onClick={() => setContacted(v)}
                        className={`px-4 py-2 border rounded-xl font-extrabold cursor-pointer transition-all ${
                          contacted === v 
                            ? 'bg-[#016FD0] border-transparent text-slate-950 shadow-[0_4px_12px_rgba(1,111,208,0.2)]' 
                            : 'bg-white/5 border-slate-200 text-slate-700 hover:bg-white/10'
                        }`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-black text-slate-700 block uppercase tracking-wide">Additional justification notes</label>
                  <textarea rows={3} placeholder="Please provide specific transaction details..." value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="border border-slate-200 rounded-xl bg-white p-3 text-xs outline-none focus:border-[#016FD0] focus:ring-1 focus:ring-[#016FD0]/50 w-full placeholder-slate-600 font-semibold text-slate-800" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Files Upload */}
          {step === 4 && (
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Step 4: Attach Support Evidence</h3>
              <UploadZone files={files} onAddFiles={handleAddFiles} onRemoveFile={handleRemoveFile} />
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Step 5: Final Review</h3>
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 text-xs font-semibold">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Merchant:</span>
                  <span className="text-slate-950 font-extrabold">{selectedTransactionForDispute?.merchant}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Dispute Reason:</span>
                  <span className="text-slate-950 font-extrabold">{reason || 'Unspecified'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Contacted Seller:</span>
                  <span className="text-slate-950 font-extrabold">{contacted || 'No'}</span>
                </div>
                {notes && (
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-slate-500 block mb-1">Remarks:</span>
                    <p className="text-slate-700 italic font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">"{notes}"</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Uploaded Evidence:</span>
                  <span className="text-[#38BDF8] font-bold">{files.length} document(s)</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between pt-6 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={handleBack} disabled={step === 1}>Back</Button>
            {step < 5 ? (
              <Button variant="primary" size="sm" onClick={handleNext} disabled={step === 2 && !reason}>Next</Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleSubmit} className="gap-1.5"><Lock className="w-3.5 h-3.5" /> Submit Case</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// ==========================================
// 4. DISPUTE TRACKING PAGE
// ==========================================

export const DisputeTracking: React.FC = () => {
  const { disputes, activeDisputeId, setActiveDisputeId, setCurrentPage } = useDisputes();
  const dispute = disputes.find(d => d.id === activeDisputeId) || disputes[0];

  const stages = [
    { title: 'Submitted', desc: 'Case received and temporary dispute credit posted.' },
    { title: 'Evidence Gathering', desc: 'Evidence reviewed by case review team.' },
    { title: 'Merchant Response', desc: 'Awaiting formal response from the billing office.' },
    { title: 'Under Review', desc: 'Senior AMEX auditor checking files.' },
    { title: 'Decision', desc: 'Ruling determined, case updates finalized.' }
  ];

  const currentStageIndex = dispute ? (dispute.status === 'Rejected' ? 4 : dispute.status === 'Merchant Response' ? 2 : dispute.status === 'Resolved' ? 4 : 1) : 0;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">Claim Investigation Center</h1>
        <p className="text-xs text-slate-500 mt-1">Monitor progress status, view merchant SLA deadlines, and contest decisions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left dispute selector sidebar */}
        <div className="space-y-3">
          <Card className="p-4 text-xs font-semibold">
            <span className="text-[9px] text-slate-500 font-black tracking-widest block mb-4 uppercase">Active Cases</span>
            <div className="space-y-2">
              {disputes.map(d => (
                <div key={d.id} onClick={() => setActiveDisputeId(d.id)}
                  className={`p-3 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                    dispute?.id === d.id 
                      ? 'bg-[#016FD0]/10 border-[#016FD0] ' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                  <div>
                    <p className="font-extrabold text-slate-900">{d.id}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{d.transaction.merchant}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right tracking timeline details */}
        {dispute ? (
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 flex justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-slate-800 font-mono tracking-wide">{dispute.id}</span>
                  <StatusChip status={dispute.status} />
                </div>
                <h3 className="text-sm font-bold text-slate-950 mt-1.5">{dispute.transaction.merchant} — ${dispute.transaction.amount.toFixed(2)}</h3>
              </div>
              {dispute.status === 'Rejected' && (
                <Button variant="danger" size="sm" onClick={() => setCurrentPage('appeal')} className="text-xs font-bold gap-1.5 shrink-0"><Scale className="w-3.5 h-3.5" /> Appeal Case</Button>
              )}
            </Card>

            {/* Merchant Countdown alerts */}
            {dispute.status === 'Merchant Response' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4.5 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider">Waiting merchant reply</span>
                  <p className="font-extrabold text-slate-950 mt-0.5">SLA Countdown Active</p>
                </div>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg font-bold">4 Days Remaining</span>
              </div>
            )}

            {/* Decision Memo */}
            {dispute.decisionExplanation && (
              <Card className="border-l-4 border-l-[#EF4444] bg-red-950/10 p-5 text-xs text-slate-700 font-semibold space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Auditor Resolution Memo</span>
                <p className="leading-relaxed"><b className="text-slate-950">Decision Explanation:</b> {dispute.decisionExplanation}</p>
              </Card>
            )}

            {/* Vertical timeline */}
            <Card className="p-6">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Workflow Steps</h4>
              <div className="border-l-2 border-slate-200 pl-5 space-y-6 ml-2 relative">
                {stages.map((st, i) => {
                  const active = i === currentStageIndex;
                  const passed = i < currentStageIndex;
                  const dotColor = active 
                    ? 'bg-[#016FD0] ring-4 ring-[#016FD0]/20 border-[#38BDF8] ' 
                    : passed 
                      ? 'bg-[#10B981] border-[#10B981] ' 
                      : 'bg-slate-800 border-slate-700';
                  return (
                    <div key={st.title} className="relative text-xs">
                      <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border border-slate-950 ${dotColor}`} />
                      <p className={`font-bold transition-all ${active ? 'text-slate-950 text-sm font-black' : passed ? 'text-slate-700' : 'text-slate-500'}`}>{st.title}</p>
                      <p className="text-slate-500 mt-1 leading-normal font-medium">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 text-center py-16 bg-white border border-slate-200 rounded-lg text-slate-500">No disputes found.</div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. NOTIFICATIONS PAGE
// ==========================================

export const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setCurrentPage, setActiveDisputeId } = useDisputes();

  const handleClick = (n: any) => {
    markNotificationAsRead(n.id);
    setActiveDisputeId(n.disputeId);
    setCurrentPage('my-disputes');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-1">Latest billing dispute updates and actions.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllNotificationsAsRead} className="text-xs font-bold">Mark all read</Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} onClick={() => handleClick(n)}
            className={`p-4 border rounded-lg bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all ${
              n.read ? 'border-slate-200 opacity-60' : 'border-[#016FD0]/40 ring-1 ring-[#016FD0]/10'
            }`}>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                {n.title} 
                {!n.read && <span className="w-1.5 h-1.5 bg-[#016FD0] rounded-full " />}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{n.message}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 6. APPEAL FORM PAGE
// ==========================================

export const Appeal: React.FC = () => {
  const { disputes, activeDisputeId, submitAppeal, setCurrentPage } = useDisputes();
  const dispute = disputes.find(d => d.id === activeDisputeId && d.status === 'Rejected') || disputes.find(d => d.status === 'Rejected');

  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  if (!dispute) {
    return (
      <Card className="py-12 text-center max-w-sm mx-auto text-xs space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-slate-500" />
        <h2 className="font-bold text-slate-950 uppercase tracking-wide">No Rejections Eligible</h2>
        <Button variant="primary" onClick={() => setCurrentPage('dashboard')} className="w-full">Return Dashboard</Button>
      </Card>
    );
  }

  const handleAddSample = () => {
    setFiles(prev => [...prev, { name: 'damaged_product_photo.jpg', size: '1.8 MB' }]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    submitAppeal(dispute.id, notes, files);
    setCurrentPage('my-disputes');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <h1 className="text-xl font-black text-slate-950 flex items-center gap-2"><Scale className="w-5 h-5 text-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.2)] rounded" /> File Claim Appeal</h1>
        <button onClick={() => setCurrentPage('my-disputes')} className="text-xs font-bold text-slate-500 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Back</button>
      </div>

      <Card className="border-t-3 border-t-[#EF4444] p-5 space-y-4">
        <div>
          <span className="text-[9px] font-black text-[#EF4444] uppercase tracking-widest block">Rejected Decision Review</span>
          <h3 className="text-sm font-bold text-slate-950 mt-1">{dispute.transaction.merchant} — ${dispute.transaction.amount.toFixed(2)}</h3>
        </div>
        <p className="text-xs text-slate-700 bg-red-950/15 p-3.5 rounded-xl leading-relaxed font-semibold italic border border-red-500/10">"{dispute.decisionExplanation}"</p>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleFormSubmit} className="space-y-5 text-xs font-semibold">
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block uppercase tracking-wide">Appeal Justification Notes <span className="text-[#EF4444]">*</span></label>
            <textarea required rows={4} placeholder="Refer to tracking documents, damaged package conditions, return receipts..." value={notes} onChange={(e) => setNotes(e.target.value)}
              className="border border-slate-200 rounded-xl bg-white p-3 text-xs outline-none focus:border-[#016FD0] focus:ring-1 focus:ring-[#016FD0]/50 w-full placeholder-slate-650 text-slate-800 font-semibold" />
          </div>

          <div className="space-y-2.5">
            <label className="font-bold text-slate-800 block uppercase tracking-wide">Upload Additional Evidence Documents</label>
            <div onClick={handleAddSample} className="border border-dashed border-slate-200 hover:border-[#016FD0]/40 p-6 text-center cursor-pointer rounded-xl bg-white hover:bg-slate-50 transition-all">
              <Upload className="w-6 h-6 mx-auto text-slate-500 mb-2" />
              <p className="font-bold text-slate-800">Click shortcut to upload sample damaged product photo</p>
            </div>
            {files.map((f, i) => (
              <div key={i} className="flex justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl items-center shadow-sm">
                <span className="font-extrabold text-slate-800">{f.name} ({f.size})</span>
                <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-[#EF4444] font-bold cursor-pointer">Remove</button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setCurrentPage('my-disputes')}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={!notes.trim()} className="gap-1.5"><Lock className="w-3.5 h-3.5" /> Submit Appeal File</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ==========================================
// 7. SETTINGS PAGE
// ==========================================

export const Settings: React.FC = () => {
  const handleReset = () => {
    if (confirm("Reset simulation database to initial starting states?")) {
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">Portal Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure profile preferences and console parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          {['Cardholder Profile', 'Communications', 'Demo Console'].map((tab, i) => (
            <button key={tab} className={`w-full text-left px-3.5 py-2.5 text-xs font-black rounded-xl cursor-pointer ${i === 0 ? 'bg-white/5 text-[#38BDF8] border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{tab}</button>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6 text-xs font-semibold">
          <Card className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-950 border-b border-slate-200 pb-3">David K. — Member Since 2018</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1">Card Tier</span>
                <span className="text-gradient-gold font-black">Platinum Card (•••• 91008)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold block uppercase tracking-wider mb-1">Region</span>
                <span className="text-slate-800 font-bold">New York, NY</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-amber-500/20 bg-amber-500/[0.02] space-y-4">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2"><Database className="w-4.5 h-4.5 text-amber-500" /> Hackathon Demo Admin Console</h4>
            <p className="text-slate-500 leading-relaxed font-medium">Restore original database charges and flags to re-run dispute demonstration flows for judges.</p>
            <Button variant="outline" onClick={handleReset} className="text-xs font-bold gap-1.5 text-amber-300 border-amber-500/20 hover:bg-amber-500/10 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Simulation Data
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

