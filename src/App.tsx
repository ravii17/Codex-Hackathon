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
  Settings 
} from './components/PortalPages';
import { Login } from './components/Login';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const AppContent: React.FC = () => {
  const { currentPage, isAuthenticated } = useDisputes();

  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Login />
        </motion.div>
      </AnimatePresence>
    );
  }

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
      default:
        return <Dashboard />;
    }
  };

  return (
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
