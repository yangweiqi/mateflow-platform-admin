import type { SuperAdminInfo } from '@/services/types.gen';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import React from 'react';

export interface FormValueType extends Partial<SuperAdminInfo> {
  password?: string;
}

export interface UpdateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalVisible: boolean;
  values: Partial<SuperAdminInfo>;
}

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  return (
    <ModalForm<FormValueType>
      title="Update Admin"
      width={520}
      open={props.updateModalVisible}
      onOpenChange={(visible) => {
        if (!visible) {
          props.onCancel();
        }
      }}
      initialValues={{
        id: props.values.id,
        name: props.values.name,
        email: props.values.email,
      }}
      onFinish={async (values) => {
        await props.onSubmit(values);
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
    >
      <ProFormText name="id" label="ID" disabled />
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
        label="New Password"
        placeholder="Leave empty to keep current password"
        rules={[
          {
            min: 6,
            message: 'Password must be at least 6 characters!',
          },
        ]}
      />
    </ModalForm>
  );
};

export default UpdateForm;
