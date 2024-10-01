import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { NavBar } from 'react-vant';

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
      onClickLeft={() => router.back()}
      title={title}
      // right={right}
    />
  );
};

export default NavBarApp;
