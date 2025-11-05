import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';
import { history, useModel } from '@umijs/max';
import React from 'react';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always call hooks unconditionally (React Rules of Hooks)
  const { location } = history;
  const isLoginPage = location.pathname === '/login';

  // Always call useModel, even on login page
  const {
    showTimeoutWarning = false,
    timeRemaining = 0,
    extendSession,
    signOut,
    setShowTimeoutWarning,
  } = useModel('auth');

  const handleExtendSession = async () => {
    if (extendSession) {
      await extendSession();
    }
  };

  const handleLogout = async () => {
    if (setShowTimeoutWarning) {
      setShowTimeoutWarning(false);
    }
    if (signOut) {
      await signOut();
    }
    history.push('/login');
  };

  return (
    <>
      {children}
      {!isLoginPage && (
        <SessionTimeoutWarning
          visible={showTimeoutWarning}
          timeRemaining={timeRemaining}
          onExtend={handleExtendSession}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
