import {
  presetThemeServiceCreatePresetTheme,
  presetThemeServiceDeletePresetTheme,
  presetThemeServiceListPresetThemes,
  presetThemeServiceUpdatePresetTheme,
} from '@/services';
import type { PresetThemeInfo } from '@/services/types.gen';
import type { ProColumns } from '@ant-design/pro-components';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { App, Badge, Button, Divider, Drawer, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

const PresetThemes: React.FC = () => {
  const { message } = App.useApp();
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState<
    Partial<PresetThemeInfo>
  >({});
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<PresetThemeInfo>();
  const [selectedRowsState, setSelectedRows] = useState<PresetThemeInfo[]>([]);

  /**
   * Add new preset theme
   */
  const handleAdd = async (fields: {
    name?: string;
    description?: string;
    category?: string;
    config?: string;
    primary_color?: string;
    accent_color?: string;
    secondary_color?: string;
    border_color?: string;
    published?: boolean;
  }) => {
    const hide = message.loading('Creating...');
    try {
      const response = await presetThemeServiceCreatePresetTheme({
        body: {
          name: fields.name,
          description: fields.description,
          category: fields.category,
          config: fields.config,
          primary_color: fields.primary_color,
          accent_color: fields.accent_color,
          secondary_color: fields.secondary_color,
          border_color: fields.border_color,
          published: fields.published,
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
   * Update preset theme
   */
  const handleUpdate = async (fields: FormValueType) => {
    const hide = message.loading('Updating...');
    try {
      const response = await presetThemeServiceUpdatePresetTheme({
        body: {
          id: fields.id,
          name: fields.name,
          description: fields.description,
          category: fields.category,
          config: fields.config,
          primary_color: fields.primary_color,
          accent_color: fields.accent_color,
          secondary_color: fields.secondary_color,
          border_color: fields.border_color,
          published: fields.published,
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
   * Delete preset theme
   */
  const handleRemove = async (selectedRows: PresetThemeInfo[]) => {
    const hide = message.loading('Deleting...');
    if (!selectedRows || selectedRows.length === 0) return true;

    try {
      const deletePromises = selectedRows.map((row) =>
        presetThemeServiceDeletePresetTheme({
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
   * Delete single preset theme
   */
  const handleSingleRemove = async (record: PresetThemeInfo) => {
    const hide = message.loading('Deleting...');
    try {
      const response = await presetThemeServiceDeletePresetTheme({
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

  const columns: ProColumns<PresetThemeInfo>[] = [
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
      title: 'Category',
      dataIndex: 'category',
      hideInSearch: true,
      width: 120,
      render: (_, record) => <Tag color="blue">{record.category || '-'}</Tag>,
    },
    {
      title: 'Primary Color',
      dataIndex: 'primary_color',
      hideInSearch: true,
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.primary_color && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: record.primary_color,
                border: '1px solid #d9d9d9',
              }}
            />
          )}
          <span>{record.primary_color || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Published',
      dataIndex: 'published',
      hideInSearch: true,
      width: 100,
      render: (_, record) => (
        <Badge
          status={record.published ? 'success' : 'default'}
          text={record.published ? 'Published' : 'Draft'}
        />
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      hideInForm: true,
      hideInSearch: true,
      width: 180,
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      hideInForm: true,
      hideInSearch: true,
      width: 180,
    },
    {
      title: 'Actions',
      dataIndex: 'option',
      valueType: 'option',
      width: 150,
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
            title="Are you sure you want to delete this theme?"
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
        title: 'Preset Theme',
      }}
    >
      <ProTable<PresetThemeInfo>
        headerTitle="Preset Theme List"
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
            New Preset Theme
          </Button>,
        ]}
        request={async (params) => {
          try {
            const response = await presetThemeServiceListPresetThemes({
              body: {
                page: params.current || 1,
                page_size: params.pageSize || 10,
                name: params.name || '',
              },
            });

            if (response.data?.code === 0) {
              return {
                data: response.data?.data?.preset_themes || [],
                total: response.data?.data?.total || 0,
                success: true,
              };
            } else {
              message.error(response.data?.msg || 'Failed to fetch theme list');
              return {
                data: [],
                total: 0,
                success: false,
              };
            }
          } catch (error: any) {
            message.error(error?.message || 'Failed to fetch theme list');
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
            title={`Are you sure you want to delete ${selectedRowsState.length} theme(s)?`}
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
          <ProDescriptions<PresetThemeInfo>
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

export default PresetThemes;
