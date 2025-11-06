import { creatorServiceListCreators } from '@/services';
import type { CreatorInfo } from '@/services/types.gen';
import type { ProColumns } from '@ant-design/pro-components';
import {
  ActionType,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { App, Avatar, Badge, Drawer } from 'antd';
import React, { useRef, useState } from 'react';

const Creators: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<CreatorInfo>();

  const columns: ProColumns<CreatorInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      width: 100,
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      hideInSearch: true,
      width: 80,
      render: (_, record) => (
        <Avatar
          src={record.avatar}
          size={40}
          style={{ backgroundColor: '#1890ff' }}
        >
          {record.display_name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      ),
    },
    {
      title: 'Display Name',
      dataIndex: 'display_name',
      formItemProps: {
        rules: [
          {
            required: true,
            message: 'Display Name is required',
          },
        ],
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      formItemProps: {
        rules: [
          {
            required: true,
            message: 'Email is required',
          },
          {
            type: 'email',
            message: 'Please enter a valid email',
          },
        ],
      },
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
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 180,
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
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
        title: 'Creators',
      }}
    >
      <ProTable<CreatorInfo>
        headerTitle="Creator List"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          try {
            const response = await creatorServiceListCreators({
              body: {
                page: params.current || 1,
                page_size: params.pageSize || 10,
                display_name: params.display_name || '',
                email: params.email || '',
              },
            });

            if (response.data?.code === 0) {
              return {
                data: response.data?.data?.creators || [],
                total: response.data?.data?.total || 0,
                success: true,
              };
            } else {
              message.error(
                response.data?.msg || 'Failed to fetch creator list',
              );
              return {
                data: [],
                total: 0,
                success: false,
              };
            }
          } catch (error: any) {
            message.error(error?.message || 'Failed to fetch creator list');
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
        width={600}
        open={!!row}
        onClose={() => {
          setRow(undefined);
        }}
        closable={false}
      >
        {row?.display_name && (
          <ProDescriptions<CreatorInfo>
            column={1}
            title={row?.display_name}
            request={async () => ({
              data: row || {},
            })}
            params={{
              id: row?.id,
            }}
            columns={columns.filter((col) => col.dataIndex !== 'option') as any}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default Creators;
