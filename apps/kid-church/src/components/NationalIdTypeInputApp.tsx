import {
  ID_TYPE_MAPPER,
  idGuardianTypeSelect,
  IdType,
  UserIdType,
} from '@faith-forge-web/models';
import React from 'react';
import { Picker, PickerColumnOption, Field } from 'react-vant';

interface NationalIdTypeInputAppValue {
  label: string;
  value: string;
}

type NationalIdTypeInputAppProps = {
  value?: NationalIdTypeInputAppValue;
  disabled?: boolean;
  onChange?: (value: NationalIdTypeInputAppValue) => void;
};

const NationalIdTypeInputApp = ({
  value = { label: IdType.CC, value: UserIdType.CC },
  disabled = false,
  onChange,
}: NationalIdTypeInputAppProps) => {
  const trigger = (changedValue: Partial<NationalIdTypeInputAppValue>) => {
    onChange?.({ ...value, ...changedValue });
  };

  const onValueChange = (label: string) => {
    const value = ID_TYPE_MAPPER[label as IdType];
    trigger({ label, value });
  };

  return (
    <Picker
      popup={{
        round: true,
      }}
      value={value.label}
      defaultValue={IdType.CC}
      columns={idGuardianTypeSelect.map((a) => a.label)}
      onConfirm={onValueChange}
      confirmButtonText="Confirmar"
      cancelButtonText="Cancelar"
      placeholder=""
    >
      {(_, selectRow: PickerColumnOption, actions) => {
        return (
          <Field
            readOnly
            clickable
            value={value.label}
            onClick={() => actions.open()}
            style={{ paddingLeft: 0 }}
            disabled={disabled}
          />
        );
      }}
    </Picker>
  );
};

export default NationalIdTypeInputApp;
