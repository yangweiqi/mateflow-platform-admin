import type { PresetThemeInfo } from '@/services/types.gen';
import {
  ModalForm,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { ColorPicker, Form } from 'antd';
import type { Color } from 'antd/es/color-picker';
import React from 'react';

export interface FormValueType extends Partial<PresetThemeInfo> {
  config?: string;
}

export interface CreateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  createModalVisible: boolean;
}

const CreateForm: React.FC<CreateFormProps> = (props) => {
  return (
    <ModalForm<FormValueType>
      title="Create New Preset Theme"
      width={680}
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
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <ProFormText
        name="name"
        label="Name"
        placeholder="Enter theme name"
        rules={[{ required: true, message: 'Please enter the theme name!' }]}
      />
      <ProFormTextArea
        name="description"
        label="Description"
        placeholder="Enter theme description"
        fieldProps={{
          rows: 3,
        }}
      />
      <ProFormText
        name="category"
        label="Category"
        placeholder="e.g., Modern, Classic, Minimal"
      />
      <Form.Item
        name="primary_color"
        label="Primary Color"
        tooltip="Select primary color"
        getValueFromEvent={(color: Color) => color.toHexString()}
      >
        <ColorPicker showText format="hex" />
      </Form.Item>
      <Form.Item
        name="accent_color"
        label="Accent Color"
        tooltip="Select accent color"
        getValueFromEvent={(color: Color) => color.toHexString()}
      >
        <ColorPicker showText format="hex" />
      </Form.Item>
      <Form.Item
        name="secondary_color"
        label="Secondary Color"
        tooltip="Select secondary color"
        getValueFromEvent={(color: Color) => color.toHexString()}
      >
        <ColorPicker showText format="hex" />
      </Form.Item>
      <Form.Item
        name="border_color"
        label="Border Color"
        tooltip="Select border color"
        getValueFromEvent={(color: Color) => color.toHexString()}
      >
        <ColorPicker showText format="hex" />
      </Form.Item>
      <ProFormTextArea
        name="config"
        label="Config (JSON)"
        placeholder='{"light": {...}, "dark": {...}}'
        tooltip="Theme configuration in JSON format"
        fieldProps={{
          rows: 6,
        }}
      />
      <ProFormSwitch
        name="published"
        label="Published"
        tooltip="Whether to publish this theme"
        initialValue={false}
      />
    </ModalForm>
  );
};

export default CreateForm;
