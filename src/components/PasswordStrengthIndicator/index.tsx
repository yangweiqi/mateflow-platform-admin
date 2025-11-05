/**
 * Password Strength Indicator Component
 * Visual feedback for password strength
 */

import {
  validatePasswordStrength,
  type PasswordStrength,
} from '@/utils/passwordValidator';
import { Progress, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.less';

const { Text } = Typography;

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
  showLabel?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  showFeedback = true,
  showLabel = true,
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (!password) {
      setStrength(null);
      return;
    }

    const result = validatePasswordStrength(password);
    setStrength(result);
  }, [password]);

  if (!strength || !password) {
    return null;
  }

  const progressPercent = (strength.score / 4) * 100;

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Progress bar */}
        <Progress
          percent={progressPercent}
          strokeColor={strength.color}
          showInfo={false}
          size="small"
        />

        {/* Strength label */}
        {showLabel && (
          <Text
            style={{
              color: strength.color,
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {strength.label}
          </Text>
        )}

        {/* Feedback messages */}
        {showFeedback && strength.feedback.length > 0 && (
          <ul className={styles.feedback}>
            {strength.feedback.map((message, index) => (
              <li key={index}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {message}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </Space>
    </div>
  );
}
