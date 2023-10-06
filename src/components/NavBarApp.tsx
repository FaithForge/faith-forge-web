import { NavBar } from 'antd-mobile';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

type Props = {
  title: string;
  right?: ReactNode;
};

const NavBarApp = ({ title, right }: Props) => {
  const router = useRouter();

  return (
    <NavBar
      style={{
        position: 'sticky',
        top: '0',
        zIndex: 100,
        backgroundColor: 'white',
        '--height': '49px',
      }}
      onBack={() => router.back()}
      right={right}
    >
      {title}
    </NavBar>
  );
};

export default NavBarApp;
