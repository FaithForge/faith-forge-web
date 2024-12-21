import { ArrowDown } from '@react-vant/icons';
import React from 'react';
import { Input, Picker, PickerColumnOption, Space } from 'react-vant';

const columns = [
  { text: '57 🇨🇴', value: '+57' }, // Colombia (América del Sur)
  { text: '1 🇺🇸', value: '+1' }, // Estados Unidos (América del Norte)
  { text: '1 🇨🇦', value: '+1' }, // Canadá (América del Norte)
  { text: '33 🇫🇷', value: '+33' }, // Francia (Europa)
  { text: '34 🇪🇸', value: '+34' }, // España (Europa)
  { text: '39 🇮🇹', value: '+39' }, // Italia (Europa)
  { text: '44 🇬🇧', value: '+44' }, // Reino Unido (Europa)
  { text: '49 🇩🇪', value: '+49' }, // Alemania (Europa)
  { text: '51 🇵🇪', value: '+51' }, // Perú (América del Sur)
  { text: '52 🇲🇽', value: '+52' }, // México (América del Norte)
  { text: '54 🇦🇷', value: '+54' }, // Argentina (América del Sur)
  { text: '56 🇨🇱', value: '+56' }, // Chile (América del Sur)
  { text: '58 🇻🇪', value: '+58' }, // Venezuela (América del Sur)
  { text: '502 🇬🇹', value: '+502' }, // Guatemala (América Central)
  { text: '503 🇸🇻', value: '+503' }, // El Salvador (América Central)
  { text: '504 🇭🇳', value: '+504' }, // Honduras (América Central)
  { text: '505 🇳🇮', value: '+505' }, // Nicaragua (América Central)
  { text: '506 🇨🇷', value: '+506' }, // Costa Rica (América Central)
  { text: '507 🇵🇦', value: '+507' }, // Panamá (América Central)
  { text: '591 🇧🇴', value: '+591' }, // Bolivia (América del Sur)
  { text: '593 🇪🇨', value: '+593' }, // Ecuador (América del Sur)
  { text: '595 🇵🇾', value: '+595' }, // Paraguay (América del Sur)
  { text: '598 🇺🇾', value: '+598' }, // Uruguay (América del Sur)
];

interface MobileInputValue {
  prefix: string;
  value: string;
}

type MobileInputAppProps = {
  value?: MobileInputValue;
  disabled?: boolean;
  onChange?: (value: MobileInputValue) => void;
};

export const checkPhoneField = (_: unknown, value: MobileInputValue) => {
  const phoneNumber = value.value.trim();
  if (value.prefix && phoneNumber.length >= 7) {
    return Promise.resolve();
  }

  return Promise.reject();
};

const MobileInputApp = ({
  value = { prefix: '+57', value: '' },
  disabled = false,
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
        {(_, selectRow: PickerColumnOption, actions) => {
          return (
            <Space>
              <Space
                align="center"
                onClick={() => (disabled ? null : actions.open())}
              >
                <div>+{selectRow?.text}</div>
                <ArrowDown style={{ display: 'block' }} />
              </Space>
              <Input
                value={value.value}
                placeholder="Escribir telefono..."
                type="tel"
                autoComplete="false"
                onChange={onMobileChange}
                disabled={disabled}
              />
            </Space>
          );
        }}
      </Picker>
    </>
  );
};

export default MobileInputApp;
