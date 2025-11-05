import type { SuperAdminInfo } from '@/services/types.gen';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import React from 'react';

export interface FormValueType extends Partial<SuperAdminInfo> {
  password?: string;
}

export interface CreateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  createModalVisible: boolean;
}

const CreateForm: React.FC<CreateFormProps> = (props) => {
  return (
    <ModalForm<FormValueType>
      title="Create New Admin"
      width={520}
      open={props.createModalVisible}
      onOpenChange={(visible) => {
        if (!visible) {
          props.onCancel();
        }
      }}
      onFinish={async (values) => {
        await props.onSubmit(values);
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
    >
      <ProFormText
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please enter the name!' }]}
      />
      <ProFormText
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter the email!' },
          { type: 'email', message: 'Please enter a valid email!' },
        ]}
      />
      <ProFormText.Password
        name="password"
        label="Password"
        rules={[
          { required: true, message: 'Please enter the password!' },
          {
            min: 6,
            message: 'Password must be at least 6 characters!',
          },
        ]}
      />
    </ModalForm>
  );
};

export default CreateForm;
