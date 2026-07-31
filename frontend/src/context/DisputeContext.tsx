import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type AuditEvent, type InvestigationResult } from '../services/investigationWorkflow';

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
  extractedData?: string;
}

export interface Dispute {
  id: string;
  transaction: Transaction;
  reason: string;
  mappedCode: string;
  status: 'Submitted' | 'AI Investigating' | 'AI Ready' | 'Manual Review' | 'Evidence Gathering' | 'Merchant Response' | 'Under Review' | 'More Info Required' | 'Escalated' | 'Decision' | 'Resolved' | 'Rejected' | 'Appealed';
  merchantCountdown?: number;
  merchantRequirements?: string[];
  evidenceReviewed?: string[];
  submittedAt: string;
  expectedResolution: string;
  questionnaire: Record<string, string | boolean>;
  evidenceFiles: DisputeFile[];
  completenessScore: number;
  decisionExplanation?: string | null;
  customerName?: string;
  investigation?: InvestigationResult;
  auditTrail?: AuditEvent[];
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
  createDispute: (disputeData: Omit<Dispute, 'id' | 'submittedAt' | 'expectedResolution'>) => Promise<string>;
  submitAppeal: (id: string, explanation: string, files: { name: string; size: string }[]) => Promise<void>;
  investigatorAction: (id: string, action: 'approve' | 'request-info' | 'escalate' | 'override' | 'start-review', reason?: string, targetAction?: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  currentRole: string;
  investigatorFilter: string;
  setInvestigatorFilter: (filter: string) => void;
  customerId: string;
  customerName: string;
  setCustomerId: (id: string) => void;
  setCustomerName: (name: string) => void;
}

const DisputeContext = createContext<DisputeContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'amex-resolve-auth';
const BACKEND_URL = 'http://127.0.0.1:4000';

const hasSavedSession = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
};

const mapBackendStatusToFrontend = (status: string): Dispute['status'] => {
  switch (status) {
    case 'SUBMITTED': return 'Submitted';
    case 'AI_INVESTIGATING': return 'AI Investigating';
    case 'AI_READY': return 'AI Ready';
    case 'UNDER_REVIEW': return 'Under Review';
    case 'MORE_INFO_REQUIRED': return 'More Info Required';
    case 'ESCALATED': return 'Escalated';
    case 'MANUAL_REVIEW': return 'Manual Review';
    case 'RESOLVED': return 'Resolved';
    default: return 'Under Review';
  }
};

export const DisputeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [selectedTransactionForDispute, setSelectedTransactionForDispute] = useState<Transaction | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasSavedSession());
  const [currentRole, setCurrentRole] = useState<string>('cardmember');
  const [investigatorFilter, setInvestigatorFilter] = useState<string>('All');

  // Load backend data helper
  const [customerId, setCustomerId] = useState<string>(() => {
    const saved = localStorage.getItem('amex-resolve-customer-id');
    return saved || 'CUST-1008';
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    const saved = localStorage.getItem('amex-resolve-customer-name');
    return saved || 'David K.';
  });

  // Load backend data helper
  const fetchAllData = async (role = 'cardmember', activeCustomerId = customerId) => {
    try {
      const customerId = activeCustomerId;
      
      // 1. Fetch Transactions
      const txRes = await fetch(`${BACKEND_URL}/api/transactions`, {
        headers: {
          'X-User-Role': role,
          'X-Customer-Id': customerId
        }
      });
      const txData = await txRes.json();
      if (txData.ok) {
        setTransactions(txData.transactions);
      }

      // 2. Fetch Disputes Queue/Cases
      const url = role === 'investigator' 
        ? `${BACKEND_URL}/api/investigator/cases`
        : `${BACKEND_URL}/api/customer/cases`;
        
      const dispRes = await fetch(url, {
        headers: {
          'X-User-Role': role,
          'X-Customer-Id': customerId
        }
      });
      const dispData = await dispRes.json();

      if (dispData.ok) {
        const rawCases = role === 'investigator' ? dispData.cases : dispData.disputes;
        const mappedDisputes = await Promise.all(
          rawCases.map(async (c: any) => {
            const detailUrl = role === 'investigator'
              ? `${BACKEND_URL}/api/investigator/cases/${c.caseId}/investigation`
              : `${BACKEND_URL}/api/customer/cases/${c.caseId}`;

            const detailRes = await fetch(detailUrl, {
              headers: {
                'X-User-Role': role,
                'X-Customer-Id': customerId
              }
            });
            const detailData = await detailRes.json();

            if (detailData.ok) {
              const det = detailData.case;
              return {
                id: det.disputeId,
                transaction: {
                  id: det.transactionId || 'TX-1000',
                  merchant: det.merchant,
                  amount: det.amount,
                  date: det.transactionDate || det.submittedAt,
                  category: 'Retail',
                  status: 'Disputed',
                  disputeEligible: false,
                  disputeId: det.disputeId
                },
                reason: det.reason,
                mappedCode: det.mappedCode || '4554',
                status: mapBackendStatusToFrontend(det.status),
                submittedAt: det.submittedAt,
                expectedResolution: det.expectedResolution,
                questionnaire: det.questionnaire,
                completenessScore: det.completenessScore,
                decisionExplanation: det.decisionExplanation,
                customerName: det.customerName || 'David K.',
                evidenceFiles: det.evidenceFiles || [],
                investigation: det.investigation,
                auditTrail: det.auditTrail
              } as Dispute;
            }
            return null;
          })
        );

        const validDisputes = mappedDisputes.filter((d): d is Dispute => d !== null);
        setDisputes(validDisputes);

        // Generate mock notifications based on active disputes
        const notifs: Notification[] = [];
        validDisputes.forEach((disp, index) => {
          if (disp.status === 'More Info Required') {
            notifs.push({
              id: `N-info-${disp.id}`,
              title: 'More Information Required',
              message: `Your dispute for ${disp.transaction.merchant} needs supporting evidence.`,
              timeGroup: 'Today',
              read: false,
              type: 'evidence_request',
              disputeId: disp.id
            });
          } else if (index === 0) {
            notifs.push({
              id: `N-up-${disp.id}`,
              title: 'Dispute Status Updated',
              message: `Case status for ${disp.transaction.merchant} is currently: ${disp.status}.`,
              timeGroup: 'Today',
              read: false,
              type: 'update',
              disputeId: disp.id
            });
          }
        });
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('[DisputeContext] Error fetching database records:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData(currentRole);
    }
  }, [isAuthenticated, currentRole]);

  const handleSetCurrentPage = (page: string) => {
    setCurrentPage(page);
    if (page === 'investigator' || page === 'investigator-case') {
      setCurrentRole('investigator');
    } else {
      setCurrentRole('cardmember');
    }
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (normalizedEmail === 'investigator@amex.com' && password === 'password123') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      setCurrentRole('investigator');
      setCurrentPage('investigator');
      return true;
    }

    let targetCustomerId = '';
    let targetCustomerName = '';

    if (normalizedEmail === 'david.k@amex.com' && password === 'password123') {
      targetCustomerId = 'CUST-1008';
      targetCustomerName = 'David K.';
    } else if (normalizedEmail === 'alex.morgan@amex.com' && password === 'password123') {
      targetCustomerId = 'CUST-1009';
      targetCustomerName = 'Alex Morgan';
    } else if (normalizedEmail === 'sarah.j@amex.com' && password === 'password123') {
      targetCustomerId = 'CUST-1010';
      targetCustomerName = 'Sarah Jenkins';
    } else if (normalizedEmail === 'marcus.v@amex.com' && password === 'password123') {
      targetCustomerId = 'CUST-1011';
      targetCustomerName = 'Marcus Vance';
    } else if (normalizedEmail === 'elena.r@amex.com' && password === 'password123') {
      targetCustomerId = 'CUST-1012';
      targetCustomerName = 'Elena Rostova';
    }

    if (targetCustomerId) {
      setCustomerId(targetCustomerId);
      setCustomerName(targetCustomerName);
      window.localStorage.setItem('amex-resolve-customer-id', targetCustomerId);
      window.localStorage.setItem('amex-resolve-customer-name', targetCustomerName);
      window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      setCurrentRole('cardmember');
      setCurrentPage('dashboard');
      await fetchAllData('cardmember', targetCustomerId);
      return true;
    }

    setIsAuthenticated(false);
    return false;
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem('amex-resolve-customer-id');
    window.localStorage.removeItem('amex-resolve-customer-name');
    setIsAuthenticated(false);
    setCustomerId('CUST-1008');
    setCustomerName('David K.');
    setCurrentPage('dashboard');
    setCurrentRole('cardmember');
  };

  const createDispute = async (disputeData: Omit<Dispute, 'id' | 'submittedAt' | 'expectedResolution'>): Promise<string> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'cardmember',
          'X-Customer-Id': customerId
        },
        body: JSON.stringify({
          transactionId: disputeData.transaction.id,
          reason: disputeData.reason,
          mappedCode: disputeData.mappedCode,
          questionnaire: disputeData.questionnaire,
          completenessScore: disputeData.completenessScore,
          customerName: customerName,
          evidenceFiles: disputeData.evidenceFiles.map(file => ({
            name: file.name,
            size: file.size,
            category: file.category
          }))
        })
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAllData('cardmember', customerId);
        return data.caseId; // Return caseId
      } else {
        throw new Error(data.error || 'Failed to submit dispute');
      }
    } catch (err) {
      console.error('Error creating dispute:', err);
      throw err;
    }
  };

  const investigatorAction = async (id: string, action: 'approve' | 'request-info' | 'escalate' | 'override' | 'start-review', reason?: string, targetAction?: string) => {
    try {
      const caseId = id.startsWith('CASE-') ? id : `CASE-${id}`;
      const res = await fetch(`${BACKEND_URL}/api/cases/${caseId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'investigator',
          'X-Customer-Id': 'CUST-1008'
        },
        body: JSON.stringify({ action, reason, targetAction })
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAllData('investigator');
      } else {
        throw new Error(data.error || 'Failed to trigger investigator action');
      }
    } catch (err) {
      console.error('Error triggered action:', err);
    }
  };

  const submitAppeal = async (id: string, explanation: string, _files: { name: string; size: string }[]) => {
    try {
      const caseId = id.startsWith('CASE-') ? id : `CASE-${id}`;
      // Simulate/trigger senior auditor override to set case status to UNDER_REVIEW
      await fetch(`${BACKEND_URL}/api/cases/${caseId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'investigator',
          'X-Customer-Id': customerId
        },
        body: JSON.stringify({ action: 'override', reason: `Appeal submitted: ${explanation}` })
      });
      await fetchAllData('cardmember', customerId);
    } catch (e) {
      console.error('Appeal submission failed:', e);
    }
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
        setCurrentPage: handleSetCurrentPage,
        transactions,
        disputes,
        notifications,
        activeDisputeId,
        setActiveDisputeId,
        selectedTransactionForDispute,
        setSelectedTransactionForDispute,
        createDispute,
        submitAppeal,
        investigatorAction,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        currentRole,
        investigatorFilter,
        setInvestigatorFilter,
        customerId,
        customerName,
        setCustomerId,
        setCustomerName
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
