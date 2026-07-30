import React, { useState, useMemo } from 'react';
import { useDisputes, type Transaction } from '../context/DisputeContext';
import { Card, Button, StatusChip, UploadZone } from './PortalUI';
import { 
  Search, ArrowRight, ArrowLeft, CheckCircle2, ChevronRight, 
  Scale, AlertCircle, Lock, RotateCcw, Database, Upload,
  Hotel, Laptop, Coffee, Car, CreditCard, ShieldCheck
} from 'lucide-react';

// ==========================================
// 1. DASHBOARD PAGE
// ==========================================

export const Dashboard: React.FC = () => {
  const { setCurrentPage, disputes, transactions, setActiveDisputeId, setSelectedTransactionForDispute } = useDisputes();

  const stats = {
    active: disputes.filter(d => !['Resolved', 'Rejected'].includes(d.status)).length,
    balance: transactions.reduce((sum, tx) => sum + tx.amount, 0),
    eligible: transactions.filter(t => t.disputeEligible).length
  };

  const handleTrackCase = (id: string) => {
    setActiveDisputeId(id);
    setCurrentPage('my-disputes');
  };

  const featuredTransaction = transactions.find(t => t.disputeEligible) || transactions[0];
  const activityIcons = [Hotel, Laptop, Coffee, Car, CreditCard];
  const recentActivity = transactions.slice(0, 4);

  const handleReviewCharge = () => {
    if (!featuredTransaction) return;
    setSelectedTransactionForDispute(featuredTransaction);
    setCurrentPage('raise-dispute');
  };

  return (
    <div className="space-y-6 text-left">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Welcome Back</p>
          <h1 className="text-3xl font-semibold text-[#00133a] tracking-tight">Good morning, David</h1>
        </div>
        <div className="flex gap-2.5">
          <Button variant="primary" onClick={() => setCurrentPage('transactions')}>View Statement</Button>
          <Button variant="outline" onClick={() => setCurrentPage('my-disputes')}>Manage Claims</Button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="relative aspect-[1.58/1] w-full rounded-xl shadow-[0_20px_40px_rgba(15,23,42,0.14)] overflow-hidden bg-[linear-gradient(135deg,#d1d5db_0%,#f8fafc_52%,#9ca3af_100%)] border border-white">
            <div className="absolute -right-4 top-6 text-[88px] sm:text-[120px] font-black text-white/40 select-none">PLATINUM</div>
            <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8">
              <div className="flex justify-between items-start">
                <div className="w-16 h-12 bg-slate-100 border border-white/70 rounded-md shadow-inner flex items-center justify-center">
                  <div className="w-10 h-8 border border-slate-400/30 rounded" />
                </div>
                <div className="text-[#00133a] font-bold tracking-widest text-sm sm:text-lg">AMERICAN EXPRESS</div>
              </div>

              <div>
                <div className="text-slate-600 font-mono text-lg sm:text-xl tracking-[0.2em] mb-3">.... .... .... 91008</div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Member Since</p>
                    <p className="text-sm font-mono text-slate-900">18</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Card Member</p>
                    <p className="text-sm font-semibold tracking-wide text-slate-900">DAVID K.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 rounded-xl">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Balance</p>
              <p className="text-xl font-semibold text-[#00133a]">${stats.balance.toFixed(2)}</p>
            </Card>
            <Card className="p-6 rounded-xl">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Active Claims</p>
              <p className="text-xl font-semibold text-[#00133a]">{stats.active}</p>
            </Card>
            <Card className="p-6 rounded-xl border-l-4 border-l-[#005eb1]">
              <p className="text-xs font-bold text-[#005eb1] uppercase mb-1">Eligible Charges</p>
              <p className="text-xl font-semibold text-[#00133a]">{stats.eligible}</p>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden min-h-[420px]">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-semibold text-[#00133a]">Recent Activity</h3>
            <button onClick={() => setCurrentPage('transactions')} className="text-[#005eb1] text-sm font-semibold hover:underline">View All</button>
          </div>

          <div className="flex-1 divide-y divide-slate-200">
            {recentActivity.map((tx, index) => {
              const Icon = activityIcons[index % activityIcons.length];
              const featured = tx.id === featuredTransaction?.id;
              return (
                <button
                  key={tx.id}
                  onClick={() => tx.disputeEligible ? handleReviewCharge() : setCurrentPage('transactions')}
                  className={`w-full p-6 text-left transition-colors relative ${featured ? 'bg-[#f2f4f6] hover:bg-[#edeef0]' : 'hover:bg-[#f8f9fb]'}`}
                >
                  {featured && <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#005eb1]" />}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${featured ? 'bg-[#d5e3ff] text-[#003365]' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <h4 className="font-semibold text-[#00133a] truncate">{tx.merchant}</h4>
                        <p className="font-semibold text-[#00133a]">${tx.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center gap-3 mt-1">
                        <p className="text-sm text-slate-500">{tx.category} | {tx.date}</p>
                        {featured && <span className="text-[10px] px-2 py-0.5 bg-[#005eb1]/10 text-[#005eb1] rounded-full font-bold uppercase">Review</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="bg-[#dae2ff] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center text-[#00133a] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#001946] mb-1">Smart Dispute Protection</h3>
            <p className="text-sm text-[#284482] max-w-xl">A recent eligible charge is ready for review. You can open a claim or continue monitoring your account activity.</p>
          </div>
        </div>
        <Button className="bg-white text-[#00133a] border-white hover:bg-slate-50 shrink-0" onClick={handleReviewCharge}>
          Review Charge
        </Button>
      </section>

      {disputes.length > 0 && (
        <Card className="p-0 overflow-hidden rounded-xl">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#00133a]">Open Claims</h3>
              <p className="text-xs text-slate-500">Current dispute records and case status</p>
            </div>
            <button onClick={() => setCurrentPage('my-disputes')} className="text-[#005eb1] text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-200">
            {disputes.filter(d => d.status !== 'Resolved').slice(0, 3).map(d => (
              <div key={d.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-800 font-mono">{d.id}</span>
                    <StatusChip status={d.status} />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{d.transaction.merchant} | ${d.transaction.amount.toFixed(2)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleTrackCase(d.id)}>Track</Button>
              </div>
            ))}
          </div>
        </Card>
      )}
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
  const { selectedTransactionForDispute, setSelectedTransactionForDispute, setCurrentPage, createDispute, setActiveDisputeId, disputes } = useDisputes();
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

  const handleSubmit = async () => {
    if (!selectedTransactionForDispute) return;
    const codes: Record<string, string> = { 'Unauthorized Transaction': '4554', 'Item Not Received': '4512', 'Charged Twice': '4540', 'Defective Product': '4555' };
    const caseId = await createDispute({
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
  const submittedDispute = submittedCaseId ? disputes.find(d => d.id === submittedCaseId) : null;
  const publicInvestigationSteps = submittedDispute?.investigation?.workflowEvents || [
    { id: 'received', label: 'Dispute received', status: 'complete' as const, timestamp: '' },
    { id: 'transaction', label: 'Transaction analyzed', status: 'complete' as const, timestamp: '' },
    { id: 'classification', label: 'Case classified', status: 'complete' as const, timestamp: '' },
    { id: 'risk', label: 'Risk assessed', status: 'complete' as const, timestamp: '' },
    { id: 'recommendation', label: 'Recommendation generated', status: 'complete' as const, timestamp: '' }
  ];

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
        <Card className="max-w-xl mx-auto py-8 p-6 space-y-6">
          <div className="w-16 h-16 bg-[#10B981]/15 text-[#10B981] rounded-full flex items-center justify-center mx-auto border border-[#10B981]/30 ">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-950 uppercase tracking-wide">Dispute Lodged Successfully</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Resolve AI is investigating your dispute. Your case has been received and is moving into Amex review.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 grid grid-cols-2 text-left gap-4">
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Case ID</span>
              <p className="text-xs font-mono font-black text-[#005eb1] mt-0.5">{submittedDispute?.investigation?.caseId || `CASE-${submittedCaseId}`}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Status</span>
              <p className="text-xs font-bold text-[#10B981] mt-0.5">{submittedDispute?.status || 'Manual Review'}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Classification</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{submittedDispute?.investigation?.classification.replaceAll('_', ' ') || 'Under Review'}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Current Stage</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{submittedDispute?.status === 'AI Ready' ? 'Amex Review' : 'Under Review'}</p>
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            {publicInvestigationSteps.map(item => (
              <div key={item.id} className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>{item.label}</span>
              </div>
            ))}
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
    { title: 'AI Investigation', desc: 'Transaction, claim reason, and evidence were reviewed.' },
    { title: 'Evidence Review', desc: 'Supporting details are being checked.' },
    { title: 'Amex Review', desc: 'An Amex reviewer is preparing the next case update.' },
    { title: 'Decision', desc: 'Ruling determined, case updates finalized.' }
  ];

  const currentStageIndex = dispute ? (['Rejected', 'Resolved'].includes(dispute.status) ? 4 : dispute.status === 'AI Ready' ? 3 : dispute.status === 'Merchant Response' ? 2 : 1) : 0;

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
                {dispute.investigation && (
                  <p className="text-[11px] text-slate-500 mt-1">Case {dispute.investigation.caseId} | {dispute.investigation.classification.replaceAll('_', ' ')}</p>
                )}
              </div>
              {dispute.status === 'Rejected' && (
                <Button variant="danger" size="sm" onClick={() => setCurrentPage('appeal')} className="text-xs font-bold gap-1.5 shrink-0"><Scale className="w-3.5 h-3.5" /> Appeal Case</Button>
              )}
            </Card>

            {/* Resolve AI Reviewing Status Checkbox Panel */}
            {(['Submitted', 'AI Investigating', 'AI Ready', 'Manual Review'].includes(dispute.status)) && (
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#016FD0] animate-pulse" />
                  <p className="font-extrabold text-xs text-[#00133a]">
                    {dispute.status === 'AI Ready' 
                      ? 'Initial review complete. Your case is ready for review.' 
                      : 'Resolve AI is reviewing your dispute...'}
                  </p>
                </div>
                
                <div className="space-y-2.5 pt-1 text-xs">
                  {/* Item 1: Dispute received */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span className="text-slate-800 font-semibold">Dispute received</span>
                  </div>
                  
                  {/* Item 2: Transaction reviewed */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${['AI Investigating', 'AI Ready', 'Manual Review', 'Resolved', 'Rejected', 'Under Review'].includes(dispute.status) ? 'text-[#10B981]' : 'text-slate-350'}`} />
                    <span className={`font-semibold ${['AI Investigating', 'AI Ready', 'Manual Review', 'Resolved', 'Rejected', 'Under Review'].includes(dispute.status) ? 'text-slate-800' : 'text-slate-400'}`}>Transaction reviewed</span>
                  </div>
                  
                  {/* Item 3: Case classified */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${['AI Ready', 'Manual Review', 'Resolved', 'Rejected', 'Under Review'].includes(dispute.status) ? 'text-[#10B981]' : 'text-slate-350'}`} />
                    <span className={`font-semibold ${['AI Ready', 'Manual Review', 'Resolved', 'Rejected', 'Under Review'].includes(dispute.status) ? 'text-slate-800' : 'text-slate-400'}`}>Case classified</span>
                  </div>
                  
                  {/* Item 4: Initial investigation completed */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${['AI Ready', 'Manual Review', 'Resolved', 'Rejected', 'Under Review'].includes(dispute.status) ? 'text-[#10B981]' : 'text-slate-350'}`} />
                    <span className={`font-semibold ${['AI Ready', 'Manual Review', 'Resolved', 'Rejected', 'Under Review'].includes(dispute.status) ? 'text-slate-800' : 'text-slate-400'}`}>Initial investigation completed</span>
                  </div>
                </div>
              </Card>
            )}

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
// 5. INVESTIGATOR DASHBOARD
// ==========================================

export const InvestigatorDashboard: React.FC = () => {
  const { disputes, setActiveDisputeId, setCurrentPage } = useDisputes();
  const [filter, setFilter] = useState('All');

  const queue = disputes.filter(dispute => {
    if (filter === 'All') return true;
    if (filter === 'High Priority') return dispute.investigation?.riskLevel === 'HIGH';
    if (filter === 'AI Ready') return dispute.status === 'AI Ready';
    if (filter === 'Under Review') return dispute.status === 'Under Review';
    if (filter === 'Escalated') return dispute.status === 'Escalated';
    return true;
  });

  const openCase = (id: string) => {
    setActiveDisputeId(id);
    setCurrentPage('investigator-case');
  };

  const stats = [
    { label: 'Open Cases', value: disputes.filter(d => !['Resolved', 'Rejected'].includes(d.status)).length },
    { label: 'High Priority', value: disputes.filter(d => d.investigation?.riskLevel === 'HIGH').length },
    { label: 'AI Ready', value: disputes.filter(d => d.status === 'AI Ready').length },
    { label: 'Under Review', value: disputes.filter(d => d.status === 'Under Review').length }
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Investigator View</p>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">Resolve AI Case Queue</h1>
        <p className="text-xs text-slate-500 mt-1">Review AI-ready cases, risk signals, recommendations, and audit history.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</span>
            <p className="text-3xl font-black text-[#00133a] mt-2">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {['All', 'High Priority', 'AI Ready', 'Under Review', 'Escalated'].map(item => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${filter === item ? 'bg-[#016FD0] text-white border-[#016FD0]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Case ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Merchant</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Case Type</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {queue.map(dispute => (
                <tr key={dispute.id} onClick={() => openCase(dispute.id)} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-5 py-4 font-mono font-black text-slate-800">{dispute.id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{dispute.customerName || 'David K.'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{dispute.transaction.merchant}</td>
                  <td className="px-5 py-4 text-right font-black text-slate-950">${dispute.transaction.amount.toFixed(2)}</td>
                  <td className="px-5 py-4 text-slate-600">{dispute.investigation?.reason.replaceAll('_', ' ') || dispute.reason}</td>
                  <td className="px-5 py-4"><StatusChip status={dispute.investigation?.riskLevel || 'Manual'} /></td>
                  <td className="px-5 py-4 font-black text-[#00133a]">{dispute.investigation?.confidenceScore ?? '--'}%</td>
                  <td className="px-5 py-4"><StatusChip status={dispute.status} /></td>
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
// 6. INVESTIGATION WORKSPACE
// ==========================================

export const InvestigationWorkspace: React.FC = () => {
  const { disputes, activeDisputeId, investigatorAction, setCurrentPage } = useDisputes();
  const dispute = disputes.find(d => d.id === activeDisputeId) || disputes[0];
  const [overrideReason, setOverrideReason] = useState('');

  if (!dispute) {
    return (
      <Card className="py-12 text-center max-w-sm mx-auto">
        <p className="text-sm font-bold text-slate-700">No case selected.</p>
        <Button className="mt-4" onClick={() => setCurrentPage('investigator')}>Back to Queue</Button>
      </Card>
    );
  }

  const investigation = dispute.investigation;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => setCurrentPage('investigator')} className="text-xs font-bold text-[#005eb1] hover:underline mb-2">Back to case queue</button>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Investigation Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">{dispute.id} | {dispute.transaction.merchant} | ${dispute.transaction.amount.toFixed(2)}</p>
        </div>
        <StatusChip status={dispute.status} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">Case Details</h3>
            {[
              ['Case ID', dispute.id],
              ['Customer', dispute.customerName || 'David K.'],
              ['Merchant', dispute.transaction.merchant],
              ['Amount', `$${dispute.transaction.amount.toFixed(2)}`],
              ['Transaction Date', dispute.transaction.date],
              ['Reason', dispute.reason],
              ['Statement', String(dispute.questionnaire.additionalInfo || 'No customer statement supplied.')]
            ].map(([label, value]) => (
              <div key={label} className="border-t border-slate-200 pt-3">
                <p className="text-[10px] uppercase font-black text-slate-500">{label}</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">{value}</p>
              </div>
            ))}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-3">Evidence</h3>
            <div className="space-y-2">
              {dispute.evidenceFiles.length ? dispute.evidenceFiles.map(file => (
                <div key={file.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-xs font-bold text-slate-800">{file.name}</p>
                  <p className="text-[10px] text-slate-500">{file.size} | {file.category}</p>
                </div>
              )) : <p className="text-xs text-slate-500">No files uploaded.</p>}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-6 space-y-4">
          <Card className="p-5 space-y-5">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">Resolve AI Analysis</h3>
            {investigation ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Classification</p>
                    <p className="text-xs font-black text-[#00133a] mt-1">{investigation.classification.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Reason</p>
                    <p className="text-xs font-black text-[#00133a] mt-1">{investigation.reason.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Risk</p>
                    <p className="text-xs font-black text-[#00133a] mt-1">{investigation.riskLevel}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Confidence</p>
                    <p className="text-xs font-black text-[#00133a] mt-1">{investigation.confidenceScore}%</p>
                  </div>
                </div>

                <section>
                  <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Findings</h4>
                  <div className="space-y-2">
                    {investigation.findings.map(item => <p key={item} className="text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-700">{item}</p>)}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Signals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {investigation.signals.map(signal => (
                      <div key={signal.label} className="text-xs border border-slate-200 rounded-lg p-3">
                        <span className={`font-black ${signal.type === 'POSITIVE' ? 'text-emerald-700' : signal.type === 'WARNING' ? 'text-amber-700' : 'text-rose-700'}`}>{signal.type}</span>
                        <p className="text-slate-700 mt-1">{signal.label}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Investigation Timeline</h4>
                  <div className="space-y-2">
                    {investigation.workflowEvents.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : <p className="text-sm text-slate-500">Manual review required. Automated investigation was not available.</p>}
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <Card className="p-5 space-y-4 border-t-4 border-t-[#016FD0]">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">AI Recommendation</h3>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500">Recommended Action</p>
              <p className="text-lg font-black text-[#00133a] mt-1">{investigation?.recommendedAction.replaceAll('_', ' ') || 'MANUAL REVIEW'}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{investigation?.recommendationExplanation || 'Investigator review is required.'}</p>
            {investigation?.missingInformation.length ? (
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 mb-2">Missing Information</p>
                <ul className="space-y-1">
                  {investigation.missingInformation.map(item => <li key={item} className="text-xs text-slate-700">- {item}</li>)}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2 pt-2">
              <Button className="w-full" onClick={() => investigatorAction(dispute.id, 'approve')}>Approve Recommendation</Button>
              <Button variant="outline" className="w-full" onClick={() => investigatorAction(dispute.id, 'request-info')}>Request More Information</Button>
              <Button variant="danger" className="w-full" onClick={() => investigatorAction(dispute.id, 'escalate')}>Escalate</Button>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500">Override Reason</label>
              <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="Required for override" />
              <Button variant="secondary" className="w-full" disabled={!overrideReason.trim()} onClick={() => investigatorAction(dispute.id, 'override', overrideReason)}>Override</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-3">Audit Trail</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(dispute.auditTrail || []).map(item => (
                <div key={item.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-xs font-black text-slate-800">{item.action.replaceAll('_', ' ')}</p>
                  <p className="text-[10px] text-slate-500">{item.actorType} | {new Date(item.timestamp).toLocaleString()}</p>
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
// 7. NOTIFICATIONS PAGE
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


