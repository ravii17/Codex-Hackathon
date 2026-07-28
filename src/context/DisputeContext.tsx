import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  status: 'Posted' | 'Pending' | 'Disputed';
  disputeEligible: boolean;
  disputeId?: string;
}

export interface DisputeFile {
  id: string;
  name: string;
  size: string;
  category: string;
}

export interface Dispute {
  id: string;
  transaction: Transaction;
  reason: string;
  mappedCode: string;
  status: 'Submitted' | 'Evidence Gathering' | 'Merchant Response' | 'Under Review' | 'Decision' | 'Resolved' | 'Rejected' | 'Appealed';
  merchantCountdown?: number;
  merchantRequirements?: string[];
  evidenceReviewed?: string[];
  submittedAt: string;
  expectedResolution: string;
  questionnaire: Record<string, string | boolean>;
  evidenceFiles: DisputeFile[];
  completenessScore: number;
  decisionExplanation?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timeGroup: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
  type: 'update' | 'evidence_request' | 'appeal_warning';
  disputeId: string;
}

interface DisputeContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  transactions: Transaction[];
  disputes: Dispute[];
  notifications: Notification[];
  activeDisputeId: string | null;
  setActiveDisputeId: (id: string | null) => void;
  selectedTransactionForDispute: Transaction | null;
  setSelectedTransactionForDispute: (tx: Transaction | null) => void;
  createDispute: (disputeData: Omit<Dispute, 'id' | 'submittedAt' | 'expectedResolution'>) => string;
  submitAppeal: (id: string, explanation: string, files: { name: string; size: string }[]) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const initialTransactions: Transaction[] = [
  { id: 'TX-1001', merchant: 'Delta Air Lines', amount: 654.20, date: '2026-07-24', category: 'Travel', status: 'Posted', disputeEligible: true },
  { id: 'TX-1002', merchant: 'Amazon.com', amount: 129.99, date: '2026-07-23', category: 'Shopping', status: 'Posted', disputeEligible: true },
  { id: 'TX-1003', merchant: 'Apple Store', amount: 1299.00, date: '2026-07-20', category: 'Electronics', status: 'Posted', disputeEligible: true },
  { id: 'TX-1004', merchant: 'Uber Trip', amount: 24.50, date: '2026-07-19', category: 'Ride Share', status: 'Posted', disputeEligible: true },
  { id: 'TX-1005', merchant: 'Starbucks Coffee', amount: 15.75, date: '2026-07-19', category: 'Dining', status: 'Pending', disputeEligible: false },
  { id: 'TX-1006', merchant: 'Best Buy', amount: 459.99, date: '2026-07-15', category: 'Electronics', status: 'Disputed', disputeEligible: false, disputeId: 'AMEX-2026-00451' },
  { id: 'TX-1007', merchant: 'Target Stores', amount: 89.50, date: '2026-06-18', category: 'Shopping', status: 'Disputed', disputeEligible: false, disputeId: 'AMEX-2026-00210' }
];

const initialDisputes: Dispute[] = [
  {
    id: 'AMEX-2026-00451',
    transaction: initialTransactions[5], // Best Buy
    reason: 'Unauthorized Transaction',
    mappedCode: '4554',
    status: 'Merchant Response',
    merchantCountdown: 4,
    merchantRequirements: ['Delivery Confirmation', 'Signed Receipt'],
    evidenceReviewed: ['Receipt'],
    submittedAt: '2026-07-16',
    expectedResolution: '5 Business Days',
    questionnaire: { contactedMerchant: 'Yes', additionalInfo: 'Card in possession, charges not authorized by me.' },
    evidenceFiles: [{ id: 'f-1', name: 'invoice_statement.png', size: '1.4 MB', category: 'Invoices' }],
    completenessScore: 82
  },
  {
    id: 'AMEX-2026-00210',
    transaction: initialTransactions[6], // Target
    reason: 'Defective Product',
    mappedCode: '4555',
    status: 'Rejected',
    submittedAt: '2026-06-20',
    expectedResolution: 'Completed',
    questionnaire: { contactedMerchant: 'Yes' },
    evidenceFiles: [],
    completenessScore: 40,
    decisionExplanation: 'Rejected. Merchant provided delivery confirmation. Cardholder failed to upload photos showing item defects or proof of item return.'
  }
];

const initialNotifications: Notification[] = [
  { id: 'N-1', title: 'Dispute Case Updated', message: 'Best Buy dispute (AMEX-2026-00451) is awaiting merchant response. 4 days remaining.', timeGroup: 'Today', read: false, type: 'update', disputeId: 'AMEX-2026-00451' },
  { id: 'N-2', title: 'Appeal Window Closing', message: 'Appeal deadline for Target (AMEX-2026-00210) is approaching. 20 days remaining.', timeGroup: 'Earlier', read: false, type: 'appeal_warning', disputeId: 'AMEX-2026-00210' }
];

const DisputeContext = createContext<DisputeContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'amex-resolve-auth';
const DEMO_EMAIL = 'david.k@amex.com';
const DEMO_PASSWORD = 'password123';

const hasSavedSession = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
};

export const DisputeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [selectedTransactionForDispute, setSelectedTransactionForDispute] = useState<Transaction | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasSavedSession());

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (normalizedEmail !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setIsAuthenticated(false);
      return false;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const createDispute = (disputeData: Omit<Dispute, 'id' | 'submittedAt' | 'expectedResolution'>) => {
    const nextNum = disputes.length + 1;
    const caseId = `AMEX-2026-00${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newDispute: Dispute = {
      ...disputeData,
      id: caseId,
      submittedAt: today,
      expectedResolution: '5 Business Days',
    };

    setDisputes(prev => [newDispute, ...prev]);
    setTransactions(prev => prev.map(t => t.id === disputeData.transaction.id ? { ...t, status: 'Disputed', disputeEligible: false, disputeId: caseId } : t));
    
    setNotifications(prev => [{
      id: `N-${Date.now()}`,
      title: 'Dispute Filed Successfully',
      message: `Dispute ${caseId} for ${disputeData.transaction.merchant} has been received.`,
      timeGroup: 'Today',
      read: false,
      type: 'update',
      disputeId: caseId
    }, ...prev]);

    return caseId;
  };

  const submitAppeal = (id: string, explanation: string, files: { name: string; size: string }[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newFiles: DisputeFile[] = files.map((f, i) => ({
      id: `ap-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      category: 'Appeal Documents'
    }));

    setDisputes(prev => prev.map(disp => disp.id === id ? {
      ...disp,
      status: 'Appealed',
      decisionExplanation: `Appealed on ${today}. Under Senior Auditor review. Reason: ${explanation}`,
      evidenceFiles: [...disp.evidenceFiles, ...newFiles],
      completenessScore: Math.min(100, disp.completenessScore + 30)
    } : disp));

    setNotifications(prev => [{
      id: `N-${Date.now()}`,
      title: 'Appeal Submitted',
      message: `Appeal for dispute ${id} has been submitted for senior auditor review.`,
      timeGroup: 'Today',
      read: false,
      type: 'update',
      disputeId: id
    }, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DisputeContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        transactions,
        disputes,
        notifications,
        activeDisputeId,
        setActiveDisputeId,
        selectedTransactionForDispute,
        setSelectedTransactionForDispute,
        createDispute,
        submitAppeal,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </DisputeContext.Provider>
  );
};

export const useDisputes = () => {
  const context = useContext(DisputeContext);
  if (!context) throw new Error('useDisputes must be used within a DisputeProvider');
  return context;
};
