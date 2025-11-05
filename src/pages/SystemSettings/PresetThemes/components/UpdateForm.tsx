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

export interface UpdateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalVisible: boolean;
  values: Partial<PresetThemeInfo>;
}

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  // Convert config object to JSON string for editing
  const configString = props.values.config
    ? JSON.stringify(props.values.config, null, 2)
    : '';

  return (
    <ModalForm<FormValueType>
      title="Update Preset Theme"
      width={680}
      open={props.updateModalVisible}
      onOpenChange={(visible) => {
        if (!visible) {
          props.onCancel();
        }
      }}
      initialValues={{
        id: props.values.id,
        name: props.values.name,
        description: props.values.description,
        category: props.values.category,
        primary_color: props.values.primary_color,
        accent_color: props.values.accent_color,
        secondary_color: props.values.secondary_color,
        border_color: props.values.border_color,
        config: configString,
        published: props.values.published,
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
      <ProFormText name="id" label="ID" disabled />
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
      />
    </ModalForm>
  );
};

export default UpdateForm;
