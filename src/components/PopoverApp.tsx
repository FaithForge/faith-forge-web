import React, { ReactNode } from 'react';
import { Popover } from 'react-vant';

export interface PopoverAppAction {
  key: string;
  icon?: ReactNode;
  text: string;
  onClick: () => void;
}

export const PopoverApp = (payload: { actions: PopoverAppAction[]; icon: ReactNode }) => {
  const { actions, icon } = payload;
  const select = (option: any) => {
    const action = actions.find((action: PopoverAppAction) => action.text === option.text);

    action?.onClick();
  };

  return (
    <Popover
      style={{ alignContent: 'center' }}
      placement="bottom-end"
      actions={actions}
      onSelect={select}
      reference={icon}
    />
  );
};
