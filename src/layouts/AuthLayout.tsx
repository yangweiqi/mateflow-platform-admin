import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';
import { history, useModel } from '@umijs/max';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    showTimeoutWarning,
    timeRemaining,
    extendSession,
    signOut,
    setShowTimeoutWarning,
  } = useModel('auth');

  const handleExtendSession = async () => {
    await extendSession();
  };

  const handleLogout = async () => {
    setShowTimeoutWarning(false);
    await signOut();
    history.push('/login');
  };

  return (
    <>
      {children}
      <SessionTimeoutWarning
        visible={showTimeoutWarning}
        timeRemaining={timeRemaining}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  );
}
