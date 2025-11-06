import { siteServiceListSites } from '@/services';
import type { SiteInfo } from '@/services/types.gen';
import type { ProColumns } from '@ant-design/pro-components';
import {
  ActionType,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { App, Badge, Descriptions, Drawer, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';

const Sites: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<SiteInfo>();

  const columns: ProColumns<SiteInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      width: 100,
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      formItemProps: {
        rules: [
          {
            required: true,
            message: 'Name is required',
          },
        ],
      },
    },
    {
      title: 'Subdomain',
      dataIndex: 'subdomain',
      width: 150,
      render: (_, record) => <Tag color="blue">{record.subdomain || '-'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      hideInSearch: true,
      width: 120,
      render: (_, record) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: 'Active' },
          inactive: { color: 'default', text: 'Inactive' },
          suspended: { color: 'error', text: 'Suspended' },
        };
        const status = statusMap[record.status || 'active'];
        return <Badge status={status.color as any} text={status.text} />;
      },
    },
    {
      title: 'Settings',
      dataIndex: 'settings',
      hideInSearch: true,
      width: 150,
      render: (_, record) => (
        <Space>
          {record.is_private && <Tag color="orange">Private</Tag>}
          {record.white_label && <Tag color="green">White Label</Tag>}
        </Space>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 180,
    },
    {
      title: 'Actions',
      dataIndex: 'option',
      valueType: 'option',
      width: 100,
      render: (_, record) => (
        <>
          <a
            onClick={() => {
              setRow(record);
            }}
          >
            View
          </a>
        </>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Sites',
      }}
    >
      <ProTable<SiteInfo>
        headerTitle="Site List"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          try {
            const response = await siteServiceListSites({
              body: {
                page: params.current || 1,
                page_size: params.pageSize || 10,
                name: params.name || '',
                description: params.description || '',
                subdomain: params.subdomain || '',
              },
            });

            if (response.data?.code === 0) {
              return {
                data: response.data?.data?.sites || [],
                total: response.data?.data?.total || 0,
                success: true,
              };
            } else {
              message.error(response.data?.msg || 'Failed to fetch site list');
              return {
                data: [],
                total: 0,
                success: false,
              };
            }
          } catch (error: any) {
            message.error(error?.message || 'Failed to fetch site list');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={columns}
      />

      <Drawer
        width={700}
        open={!!row}
        onClose={() => {
          setRow(undefined);
        }}
        closable={false}
      >
        {row?.name && (
          <>
            <ProDescriptions<SiteInfo>
              column={1}
              title={row?.name}
              request={async () => ({
                data: row || {},
              })}
              params={{
                id: row?.id,
              }}
              columns={
                columns.filter(
                  (col) =>
                    col.dataIndex !== 'option' && col.dataIndex !== 'settings',
                ) as any
              }
            />
            {row.stat && (
              <Descriptions
                title="Statistics"
                bordered
                column={2}
                style={{ marginTop: 24 }}
              >
                <Descriptions.Item label="Members">
                  {row.stat.member_count || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Posts">
                  {row.stat.post_count || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Blogs">
                  {row.stat.blog_count || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Events">
                  {row.stat.event_count || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Courses">
                  {row.stat.course_count || 0}
                </Descriptions.Item>
                <Descriptions.Item label="Spaces">
                  {row.stat.space_count || 0}
                </Descriptions.Item>
              </Descriptions>
            )}
            <Descriptions
              title="Settings"
              bordered
              column={1}
              style={{ marginTop: 24 }}
            >
              <Descriptions.Item label="Private Site">
                <Badge
                  status={row.is_private ? 'success' : 'default'}
                  text={row.is_private ? 'Yes' : 'No'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="White Label">
                <Badge
                  status={row.white_label ? 'success' : 'default'}
                  text={row.white_label ? 'Yes' : 'No'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Max Members">
                {row.max_members || 'Unlimited'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default Sites;
