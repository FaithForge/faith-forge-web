/* eslint-disable @typescript-eslint/no-explicit-any */
import { healthSecurityEntitySelect } from '@faith-forge-web/models';
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

interface HealthSecurityEntitySelectorProps {
  healthSecurityEntity?: { id: string; name: string };
  onChange?: (value: { id: string; name: string }) => void;
}

export const HealthSecurityEntitySelector: FC<
  HealthSecurityEntitySelectorProps
> = ({ healthSecurityEntity, onChange }) => {
  const [searchHealthSecurityEntity, setSearchHealthSecurityEntity] =
    useState('');
  const [visibleHealthSecurityEntity, setVisibleHealthSecurityEntity] =
    useState(false);
  const filteredHealthSecurityEntity = useMemo(() => {
    if (searchHealthSecurityEntity) {
      return healthSecurityEntitySelect.filter((item) =>
        item.name
          .toLocaleLowerCase()
          .includes(searchHealthSecurityEntity.toLocaleLowerCase()),
      );
    } else {
      return healthSecurityEntitySelect;
    }
  }, [searchHealthSecurityEntity]);

  return (
    <>
      <Space align="center">
        <Button
          icon={<CiSearch />}
          onClick={() => {
            setVisibleHealthSecurityEntity(true);
          }}
        >
          Buscar
        </Button>
        <Typography.Text>{healthSecurityEntity?.name}</Typography.Text>
      </Space>
      <Popup
        visible={visibleHealthSecurityEntity}
        onClickOverlay={() => {
          setVisibleHealthSecurityEntity(false);
        }}
        position="top"
        style={{ height: '60%' }}
        destroyOnClose
      >
        <Search
          placeholder="Buscar EPS"
          value={searchHealthSecurityEntity}
          onChange={(v) => {
            setSearchHealthSecurityEntity(v);
          }}
          style={{
            padding: '12px',
            borderBottom: 'solid 1px var(--adm-color-border)',
            position: 'sticky',
            top: '0',
            zIndex: 2,
          }}
        />

        <Checkbox.Group
          style={{ '--border-top': '0', '--border-bottom': '0' }}
          defaultValue={healthSecurityEntity ? [healthSecurityEntity.id] : []}
          onChange={(val) => {
            let healthSecurityEntitySelected = healthSecurityEntitySelect.find(
              (item) => item.id === val[0],
            );
            if (!healthSecurityEntitySelected && val[0] === 'NO TIENE EPS') {
              healthSecurityEntitySelected = {
                id: 'NO TIENE EPS',
                name: 'NO TIENE EPS',
              };
            }
            onChange?.(
              healthSecurityEntitySelected
                ? {
                    id: healthSecurityEntitySelected.id,
                    name: healthSecurityEntitySelected.name,
                  }
                : { id: '', name: '' },
            );
            setVisibleHealthSecurityEntity(false);
          }}
        >
          <Cell.Group>
            {filteredHealthSecurityEntity
              ? filteredHealthSecurityEntity.map((condition: any) => (
                  // <CheckList.Item key={condition.id} value={condition.id}>
                  //   {condition.name}
                  // </CheckList.Item>
                  <Cell
                    key={condition.id}
                    clickable
                    title={condition.name}
                    // onClick={() => toggle(condition.id)}
                    rightIcon={<Checkbox name={condition.id} />}
                  />
                ))
              : null}
            <Cell
              key={'NO TIENE EPS'}
              clickable
              title={'NO TIENE EPS'}
              // onClick={() => toggle(condition.id)}
              rightIcon={<Checkbox name={'NO TIENE EPS'} />}
            />
          </Cell.Group>
        </Checkbox.Group>
      </Popup>
    </>
  );
};
