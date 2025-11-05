import {
  accountServiceChangePassword,
  accountServiceUpdateProfile,
} from '@/services';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Tabs,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

const { Text } = Typography;

const Settings: React.FC = () => {
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const { fetchAdminMe } = useModel('auth');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initialize form with current user data
  React.useEffect(() => {
    if (initialState?.currentUser?.adminInfo) {
      profileForm.setFieldsValue({
        name: initialState.currentUser.adminInfo.name,
        email: initialState.currentUser.adminInfo.email,
      });
    }
  }, [initialState, profileForm]);

  // Handle profile update
  const handleProfileUpdate = async (values: {
    name?: string;
    email?: string;
  }) => {
    setProfileLoading(true);
    try {
      const response = await accountServiceUpdateProfile({
        body: {
          name: values.name,
          email: values.email,
        },
      });

      if (response.data?.code === 0) {
        message.success('Profile updated successfully');

        // Fetch updated admin info and update both auth model and global state
        const updatedAdminInfo = await fetchAdminMe(true); // true = update auth model state

        // Also update global initial state
        if (updatedAdminInfo) {
          setInitialState({
            ...initialState,
            currentUser: {
              ...initialState?.currentUser,
              adminInfo: updatedAdminInfo,
            },
          });
        }
      } else {
        message.error(response.data?.msg || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      message.error(
        error?.message || 'Failed to update profile. Please try again.',
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    setPasswordLoading(true);
    try {
      const response = await accountServiceChangePassword({
        body: {
          old_password: values.old_password,
          new_password: values.new_password,
        },
      });

      if (response.data?.code === 0) {
        message.success('Password changed successfully');
        passwordForm.resetFields();
      } else {
        message.error(response.data?.msg || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      message.error(
        error?.message || 'Failed to change password. Please try again.',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          <span style={{ marginLeft: 8 }}>Personal Information</span>
        </span>
      ),
      children: (
        <Card variant="borderless">
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Update your personal information such as name and email address.
          </Text>

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileUpdate}
            autoComplete="off"
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: 'Please input your name!' },
                { min: 2, message: 'Name must be at least 2 characters!' },
                { max: 50, message: 'Name must not exceed 50 characters!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={profileLoading}
                size="large"
              >
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'password',
      label: (
        <span>
          <LockOutlined />
          <span style={{ marginLeft: 8 }}>Change Password</span>
        </span>
      ),
      children: (
        <Card variant="borderless">
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Ensure your account is using a long, random password to stay secure.
          </Text>

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            autoComplete="off"
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              label="Current Password"
              name="old_password"
              rules={[
                {
                  required: true,
                  message: 'Please input your current password!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter current password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="new_password"
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 8, message: 'Password must be at least 8 characters!' },
                {
                  pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message:
                    'Password must contain uppercase, lowercase, number and special character!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                {
                  required: true,
                  message: 'Please confirm your new password!',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('The two passwords do not match!'),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                size="large"
              >
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'account',
      label: (
        <span>
          <UserOutlined />
          <span style={{ marginLeft: 8 }}>Account Information</span>
        </span>
      ),
      children: (
        <Card variant="borderless">
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            View your account details and metadata.
          </Text>
          <Row gutter={[16, 24]}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">User ID:</Text>
              </div>
              <Text strong>
                {initialState?.currentUser?.adminInfo?.id || 'N/A'}
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">Email:</Text>
              </div>
              <Text strong>
                {initialState?.currentUser?.adminInfo?.email || 'N/A'}
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">Created At:</Text>
              </div>
              <Text strong>
                {initialState?.currentUser?.adminInfo?.created_at
                  ? new Date(
                      initialState.currentUser.adminInfo.created_at,
                    ).toLocaleString()
                  : 'N/A'}
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">Last Updated:</Text>
              </div>
              <Text strong>
                {initialState?.currentUser?.adminInfo?.updated_at
                  ? new Date(
                      initialState.currentUser.adminInfo.updated_at,
                    ).toLocaleString()
                  : 'N/A'}
              </Text>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div className={styles.settingsContainer}>
      <PageContainer
        title="Settings"
        content="Manage your account settings and preferences"
      >
        <Tabs
          defaultActiveKey="profile"
          items={tabItems}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        />
      </PageContainer>
    </div>
  );
};

export default Settings;
