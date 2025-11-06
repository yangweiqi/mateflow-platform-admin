import {
  superAdminServiceCreateSuperAdmin,
  superAdminServiceDeleteSuperAdmin,
  superAdminServiceListSuperAdmin,
  superAdminServiceUpdateSuperAdmin,
} from '@/services';
import type { SuperAdminInfo } from '@/services/types.gen';
import type { ProColumns } from '@ant-design/pro-components';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Divider, Drawer, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

const Admins: React.FC = () => {
  const { message } = App.useApp();
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState<Partial<SuperAdminInfo>>(
    {},
  );
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<SuperAdminInfo>();
  const [selectedRowsState, setSelectedRows] = useState<SuperAdminInfo[]>([]);

  /**
   * Add new super admin
   */
  const handleAdd = async (fields: {
    name?: string;
    email?: string;
    password?: string;
  }) => {
    const hide = message.loading('Creating...');
    try {
      const response = await superAdminServiceCreateSuperAdmin({
        body: {
          name: fields.name,
          email: fields.email,
          password: fields.password,
        },
      });

      hide();

      if (response.data?.code === 0) {
        message.success('Created successfully');
        return true;
      } else {
        message.error(response.data?.msg || 'Failed to create');
        return false;
      }
    } catch (error: any) {
      hide();
      message.error(error?.message || 'Failed to create, please try again!');
      return false;
    }
  };

  /**
   * Update super admin
   */
  const handleUpdate = async (fields: FormValueType) => {
    const hide = message.loading('Updating...');
    try {
      const response = await superAdminServiceUpdateSuperAdmin({
        body: {
          id: fields.id,
          name: fields.name,
          email: fields.email,
          password: fields.password,
        },
      });

      hide();

      if (response.data?.code === 0) {
        message.success('Updated successfully');
        return true;
      } else {
        message.error(response.data?.msg || 'Failed to update');
        return false;
      }
    } catch (error: any) {
      hide();
      message.error(error?.message || 'Failed to update, please try again!');
      return false;
    }
  };

  /**
   * Delete super admin
   */
  const handleRemove = async (selectedRows: SuperAdminInfo[]) => {
    const hide = message.loading('Deleting...');
    if (!selectedRows || selectedRows.length === 0) return true;

    try {
      const deletePromises = selectedRows.map((row) =>
        superAdminServiceDeleteSuperAdmin({
          body: {
            id: row.id,
          },
        }),
      );

      const responses = await Promise.all(deletePromises);
      hide();

      const failedCount = responses.filter(
        (response) => response.data?.code !== 0,
      ).length;

      if (failedCount === 0) {
        message.success('Deleted successfully');
        return true;
      } else {
        message.error(`Failed to delete ${failedCount} item(s)`);
        return false;
      }
    } catch (error: any) {
      hide();
      message.error(error?.message || 'Failed to delete, please try again');
      return false;
    }
  };

  /**
   * Delete single admin
   */
  const handleSingleRemove = async (record: SuperAdminInfo) => {
    const hide = message.loading('Deleting...');
    try {
      const response = await superAdminServiceDeleteSuperAdmin({
        body: {
          id: record.id,
        },
      });

      hide();

      if (response.data?.code === 0) {
        message.success('Deleted successfully');
        actionRef.current?.reload();
        return true;
      } else {
        message.error(response.data?.msg || 'Failed to delete');
        return false;
      }
    } catch (error: any) {
      hide();
      message.error(error?.message || 'Failed to delete, please try again');
      return false;
    }
  };

  const columns: ProColumns<SuperAdminInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInForm: true,
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
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInForm: true,
      hideInSearch: true,
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      hideInForm: true,
      hideInSearch: true,
    },
    {
      title: 'Actions',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <>
          <a
            onClick={() => {
              handleUpdateModalVisible(true);
              setStepFormValues(record);
            }}
          >
            Edit
          </a>
          <Divider type="vertical" />
          <Popconfirm
            title="Are you sure you want to delete this admin?"
            onConfirm={() => handleSingleRemove(record)}
            okText="Yes"
            cancelText="No"
          >
            <a style={{ color: 'red' }}>Delete</a>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Admin',
      }}
    >
      <ProTable<SuperAdminInfo>
        headerTitle="Admin List"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="1"
            type="primary"
            onClick={() => handleModalVisible(true)}
          >
            New Admin
          </Button>,
        ]}
        request={async (params) => {
          try {
            const response = await superAdminServiceListSuperAdmin({
              body: {
                page: params.current || 1,
                page_size: params.pageSize || 10,
                name: params.name || '',
                email: params.email || '',
              },
            });

            if (response.data?.code === 0) {
              return {
                data: response.data?.data?.super_admins || [],
                total: response.data?.data?.total || 0,
                success: true,
              };
            } else {
              message.error(response.data?.msg || 'Failed to fetch admin list');
              return {
                data: [],
                total: 0,
                success: false,
              };
            }
          } catch (error: any) {
            message.error(error?.message || 'Failed to fetch admin list');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              Selected{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              item(s)
            </div>
          }
        >
          <Popconfirm
            title={`Are you sure you want to delete ${selectedRowsState.length} admin(s)?`}
            onConfirm={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Batch Delete</Button>
          </Popconfirm>
        </FooterToolbar>
      )}
      <CreateForm
        onCancel={() => handleModalVisible(false)}
        createModalVisible={createModalVisible}
        onSubmit={async (values) => {
          const success = await handleAdd(values);
          if (success) {
            handleModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      />
      {stepFormValues && Object.keys(stepFormValues).length ? (
        <UpdateForm
          onSubmit={async (value) => {
            const success = await handleUpdate(value);
            if (success) {
              handleUpdateModalVisible(false);
              setStepFormValues({});
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          onCancel={() => {
            handleUpdateModalVisible(false);
            setStepFormValues({});
          }}
          updateModalVisible={updateModalVisible}
          values={stepFormValues}
        />
      ) : null}

      <Drawer
        width={600}
        open={!!row}
        onClose={() => {
          setRow(undefined);
        }}
        closable={false}
      >
        {row?.name && (
          <ProDescriptions<SuperAdminInfo>
            column={2}
            title={row?.name}
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

export default Admins;
