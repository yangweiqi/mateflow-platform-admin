import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useEffect, useState } from 'react';

interface SessionTimeoutWarningProps {
  visible: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutWarning({
  visible,
  timeRemaining,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (visible && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [visible, countdown]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      open={visible}
      title={
        <span>
          <ClockCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
          Session Timeout Warning
        </span>
      }
      closable={false}
      footer={[
        <Button key="logout" onClick={onLogout}>
          Logout Now
        </Button>,
        <Button key="extend" type="primary" onClick={onExtend}>
          Extend Session
        </Button>,
      ]}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 16, marginBottom: 16 }}>
          Your session is about to expire due to inactivity.
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: countdown < 60000 ? '#ff4d4f' : '#faad14',
            marginBottom: 16,
          }}
        >
          {formatTime(countdown)}
        </div>
        <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
          Click &quot;Extend Session&quot; to continue working, or you will be
          logged out automatically.
        </div>
      </div>
    </Modal>
  );
}
