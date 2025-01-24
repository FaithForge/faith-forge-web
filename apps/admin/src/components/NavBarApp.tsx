import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { NavBar } from 'react-vant';
import { FaChevronLeft } from 'react-icons/fa6';

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
      leftArrow={<FaChevronLeft />}
      title={title}
      rightText={right}
    />
  );
};

export default NavBarApp;
