import logo from '@/assets/logo.png';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { getCaptchaProvider, isCaptchaInitialized } from '@/utils/captcha';
import { getDeviceFingerprint } from '@/utils/deviceFingerprint';
import { LoginRateLimiter } from '@/utils/rateLimiter';
import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Alert, Button, Card, Checkbox, Form, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './index.less';

export default function LoginPage() {
  const { signIn, loading } = useModel('auth');
  const { initialState, setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm();
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If already logged in, redirect to home
    if (initialState?.currentUser?.token) {
      history.push('/');
    }

    // Check CAPTCHA initialization status
    if (isCaptchaInitialized()) {
      const captcha = getCaptchaProvider();
      captcha
        .load()
        .then(() => {
          // Render Turnstile widget in the designated container
          if (turnstileContainerRef.current && captcha.render) {
            captcha.render(turnstileContainerRef.current).catch(() => {
              // Silently handle render errors
            });
          }
        })
        .catch(() => {
          // Silently handle CAPTCHA load errors
        });
    }
  }, [initialState]);

  // Check if email is locked when it changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email && LoginRateLimiter.isLocked(email)) {
      const remainingTime = LoginRateLimiter.getRemainingLockoutTime(email);
      const minutes = Math.ceil(remainingTime / 60000);
      setIsLocked(true);
      setLockoutMessage(
        `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute${
          minutes > 1 ? 's' : ''
        }.`,
      );
    } else {
      setIsLocked(false);
      setLockoutMessage('');
    }
  };

  const handleSubmit = async (values: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    const { email, password, rememberMe = false } = values;

    // Check rate limiting
    if (LoginRateLimiter.isLocked(email)) {
      const remainingTime = LoginRateLimiter.getRemainingLockoutTime(email);
      const minutes = Math.ceil(remainingTime / 60000);
      setIsLocked(true);
      setLockoutMessage(
        `Too many failed attempts. Please try again in ${minutes} minute${
          minutes > 1 ? 's' : ''
        }.`,
      );
      return;
    }

    // Get CAPTCHA token (if CAPTCHA is initialized)
    let captchaToken: string | undefined;
    try {
      if (isCaptchaInitialized()) {
        const captcha = getCaptchaProvider();
        captchaToken = await captcha.execute('login');
      }
    } catch (error) {
      // Continue without CAPTCHA if it fails
    }

    // Get device fingerprint
    let deviceFingerprint: string | undefined;
    try {
      const deviceInfo = await getDeviceFingerprint();
      deviceFingerprint = deviceInfo.fingerprint;
    } catch (error) {
      console.error('Device fingerprint error:', error);
      // Continue without device fingerprint if it fails
    }

    // Attempt sign in with security features
    const userInfo = await signIn(
      {
        email,
        password,
        captcha_token: captchaToken,
        device_fingerprint: deviceFingerprint,
      },
      rememberMe,
    );

    if (userInfo) {
      // Update initialState with user info (includes admin info from auth model)
      await setInitialState({
        ...initialState,
        currentUser: userInfo,
      });

      // Navigate to home page
      history.push('/');
    } else {
      // Record failed attempt
      LoginRateLimiter.recordAttempt(email);

      // Check if now locked
      if (LoginRateLimiter.isLocked(email)) {
        const remainingTime = LoginRateLimiter.getRemainingLockoutTime(email);
        const minutes = Math.ceil(remainingTime / 60000);
        setIsLocked(true);
        setLockoutMessage(
          `Account locked due to multiple failed attempts. Please try again in ${minutes} minute${
            minutes > 1 ? 's' : ''
          }.`,
        );
      } else {
        const remaining = LoginRateLimiter.getRemainingAttempts(email);
        if (remaining <= 2) {
          setLockoutMessage(
            `Warning: ${remaining} login attempt${
              remaining > 1 ? 's' : ''
            } remaining before account lockout.`,
          );
        }
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.card}>
          <div className={styles.header}>
            <img alt="logo" className={styles.logo} src={logo} />

            <h1 className={styles.title}>Mateflow</h1>
            <p className={styles.subtitle}>Sign in to your account</p>
          </div>

          {/* Security warnings */}
          {isLocked && (
            <Alert
              message="Account Locked"
              description={lockoutMessage}
              type="error"
              showIcon
              icon={<SafetyOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          {!isLocked && lockoutMessage && (
            <Alert
              message="Security Warning"
              description={lockoutMessage}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                autoComplete="email"
                onChange={handleEmailChange}
                disabled={isLocked}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 8, message: 'Password must be at least 8 characters!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="current-password"
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                  setShowPasswordStrength(e.target.value.length > 0);
                }}
                disabled={isLocked}
              />
            </Form.Item>

            {/* Password strength indicator (only show during registration flow) */}
            {showPasswordStrength && passwordValue.length > 0 && (
              <PasswordStrengthIndicator
                password={passwordValue}
                showFeedback={false}
                showLabel={true}
              />
            )}

            {/* Turnstile CAPTCHA Widget Container */}
            <div
              ref={turnstileContainerRef}
              id="turnstile-container"
              style={{
                width: '100%',
                marginBottom: '16px',
                minHeight: '65px', // Reserve space for widget
              }}
            />

            <Form.Item
              name="rememberMe"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox disabled={isLocked}>Remember me for 30 days</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                disabled={isLocked}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
