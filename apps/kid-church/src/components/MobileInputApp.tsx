import { ArrowDown } from '@react-vant/icons';
import React from 'react';
import { Input, Picker, Space } from 'react-vant';

const columns = [
  { text: '57 🇨🇴', value: '+57' },
  { text: '1 🇺🇸', value: '+1' },
  { text: '58 🇻🇪', value: '+58' },
  { text: '44 🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: '+44' },
];

interface MobileInputValue {
  prefix: string;
  value: string;
}

type MobileInputAppProps = {
  value?: MobileInputValue;
  onChange?: (value: MobileInputValue) => void;
};

export const checkPhoneField = (_: any, value: MobileInputValue) => {
  const phoneNumber = value.value.trim();
  if (value.prefix && phoneNumber.length >= 10) {
    return Promise.resolve();
  }

  return Promise.reject();
};

const MobileInputApp = ({
  value = { prefix: '+57', value: '' },
  onChange,
}: MobileInputAppProps) => {
  const trigger = (changedValue: Partial<MobileInputValue>) => {
    onChange?.({ ...value, ...changedValue });
  };

  const onMobileChange = (value: string) => {
    trigger({ value });
  };

  const onPrefixChange = (prefix: string) => {
    trigger({ prefix });
  };
  return (
    <>
      <Picker
        popup
        value={value.prefix}
        placeholder={false}
        columns={columns}
        onConfirm={onPrefixChange}
        confirmButtonText={'Seleccionar'}
        cancelButtonText={'Cancelar'}
      >
        {(_, selectRow: any, actions) => {
          return (
            <Space>
              <Space align="center" onClick={() => actions.open()}>
                <div>+{selectRow?.text}</div>
                <ArrowDown style={{ display: 'block' }} />
              </Space>
              <Input
                value={value.value}
                placeholder="Escribir telefono..."
                type="tel"
                autoComplete="false"
                onChange={onMobileChange}
              />
            </Space>
          );
        }}
      </Picker>
    </>
  );
};

export default MobileInputApp;
