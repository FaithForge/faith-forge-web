import React from 'react';
import { Tag } from 'react-vant';

const TagKidGroupApp = ({
  kidGroup,
  staticGroup = false,
}: {
  kidGroup: string;
  staticGroup?: boolean;
}) => {
  let color = '#000';

  switch (kidGroup) {
    case 'Bebes':
      color = '#78B2DA';
      break;
    case 'Caminadores':
      color = '#5E97BE';
      break;
    case 'Zaqueos':
      color = '#427DA3';
      break;
    case 'Jeremias':
      color = '#236488';
      break;
    case 'Timoteos':
      color = '#004C6D';
      break;
    case 'Titos':
      color = '#00344D';
      break;
    case 'Yo Soy Iglekids':
      color = '#EFCB68';
      break;
  }

  return (
    <Tag type="primary" size="large" color={color}>
      {kidGroup} {staticGroup ? '(Estatico)' : ''}
    </Tag>
  );
};

export default TagKidGroupApp;
