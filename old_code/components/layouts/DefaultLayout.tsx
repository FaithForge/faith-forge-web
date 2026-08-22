import React from 'react';

type Props = {
  children?: React.ReactNode;
};

const DefaultLayout = ({ children }: Props) => {
  return (
    <>
      <div style={{ minHeight: '100vh' }}>{children}</div>
    </>
  );
};

export default DefaultLayout;
