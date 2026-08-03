import React from 'react';
import { DisputeProvider, useDisputes } from './context/DisputeContext';
import { AppLayout } from './components/PortalUI';
import { 
  Dashboard, 
  Transactions, 
  DisputeWizard, 
  DisputeTracking, 
  Notifications, 
  Appeal, 
  Settings,
  InvestigatorDashboard,
  InvestigationWorkspace
} from './components/PortalPages';
import { Login } from './components/Login';
import { ToastNotification } from './components/ToastNotification';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const AppContent: React.FC = () => {
  const { currentPage, isAuthenticated } = useDisputes();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'raise-dispute':
        return <DisputeWizard />;
      case 'my-disputes':
        return <DisputeTracking />;
      case 'notifications':
        return <Notifications />;
      case 'appeal':
        return <Appeal />;
      case 'settings':
        return <Settings />;
      case 'investigator':
        return <InvestigatorDashboard />;
      case 'investigator-case':
        return <InvestigationWorkspace />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <ToastNotification />
      {!isAuthenticated ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Login />
          </motion.div>
        </AnimatePresence>
      ) : (
        <AppLayout>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </AppLayout>
      )}
    </>
  );
};

function App() {
  return (
    <DisputeProvider>
      <AppContent />
    </DisputeProvider>
  );
}

export default App;
