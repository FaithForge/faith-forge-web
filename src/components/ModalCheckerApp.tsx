import { FC, useMemo, useState } from 'react';
import {
  Button,
  Cell,
  Checkbox,
  Popup,
  Search,
  Space,
  Typography,
} from 'react-vant';
import { CiSearch } from 'react-icons/ci';
import { SelectorOptionApp } from '@/libs/common-types/global';

interface ModalCheckerProps {
  options: SelectorOptionApp[];
  placeholder: string;
  emptyOption?: SelectorOptionApp;
  searchButtonText?: string;
  value?: SelectorOptionApp;
  onChange?: (value: SelectorOptionApp) => void;
}

export const ModalCheckerApp: FC<ModalCheckerProps> = ({
  options,
  placeholder,
  emptyOption,
  searchButtonText = 'Buscar',
  value,
  onChange,
}) => {
  const [searchOptions, setSearchOptions] = useState('');
  const [visible, setVisible] = useState(false);
  const filteredOptions = useMemo(() => {
    if (searchOptions) {
      return options.filter((item) =>
        item.name
          .toLocaleLowerCase()
          .includes(searchOptions.toLocaleLowerCase()),
      );
    } else {
      return options;
    }
  }, [options, searchOptions]);

  const onClick = (val: string) => {
    let optionSelected = options.find((item) => item.id === val);
    if (!optionSelected && val === emptyOption?.id) {
      optionSelected = emptyOption;
    }

    onChange?.(
      optionSelected
        ? {
            id: optionSelected.id,
            name: optionSelected.name,
          }
        : { id: '', name: '' },
    );
    setVisible(false);
  };

  return (
    <>
      <Space align="center">
        <Button
          icon={<CiSearch />}
          onClick={() => {
            setVisible(true);
          }}
          size="small"
        >
          {searchButtonText}
        </Button>
        <Typography.Text>{value?.name}</Typography.Text>
      </Space>
      <Popup
        visible={visible}
        onClickOverlay={() => {
          setVisible(false);
        }}
        position="top"
        style={{ height: '50%' }}
        destroyOnClose
      >
        <Search
          placeholder={placeholder}
          value={searchOptions}
          onChange={(text: string) => {
            setSearchOptions(text);
          }}
        />

        <Checkbox.Group max={1} value={[value?.id]} style={{ width: '100%' }}>
          <Cell.Group>
            {filteredOptions
              ? filteredOptions.map((condition) => (
                  <Cell
                    key={condition.id}
                    clickable
                    title={condition.name}
                    onClick={() =>
                      onClick(value?.id !== condition.id ? condition.id : '')
                    }
                    rightIcon={<Checkbox name={condition.id} />}
                  />
                ))
              : null}
            {emptyOption ? (
              <Cell
                key={emptyOption.id}
                clickable
                title={emptyOption.name}
                onClick={() =>
                  onClick(value?.id !== emptyOption.id ? emptyOption.id : '')
                }
                rightIcon={<Checkbox name={emptyOption.id} />}
              />
            ) : null}
          </Cell.Group>
        </Checkbox.Group>
      </Popup>
    </>
  );
};
