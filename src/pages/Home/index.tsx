// import Guide from '@/components/Guide';
// import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Alert, Card, Descriptions } from 'antd';
import styles from './index.less';

const HomePage: React.FC = () => {
  // const { name } = useModel('global');
  const { initialState } = useModel('@@initialState');
  const { currentUser } = useModel('auth');

  return (
    <PageContainer ghost>
      <div className={styles.container}>
        <Card style={{ marginBottom: 24 }}>
          <Alert
            message="Welcome to Platform Admin!"
            description="You are successfully authenticated. All API requests now include your JWT token automatically."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Descriptions title="Authentication Status" bordered>
            <Descriptions.Item label="Status" span={3}>
              Authenticated ✅
            </Descriptions.Item>
            <Descriptions.Item label="Token Present" span={3}>
              {initialState?.currentUser?.token ? 'Yes' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={3}>
              {currentUser?.email || initialState?.currentUser?.email || 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </PageContainer>
  );
};

export default HomePage;
