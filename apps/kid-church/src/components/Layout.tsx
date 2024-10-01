import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthWrapper } from './AuthWrapper';
import { Tabbar } from 'react-vant';
import { Search, SettingO, SmileO } from '@react-vant/icons';
import { IsRegisterKidChurch, IsSupervisorKidChurch, IsAllRole } from '../utils/auth';

type Props = {
  children?: React.ReactNode;
};

const tabs = [
  {
    key: '/registration',
    title: 'Registro',
    icon: <Search />,
    show: () => IsRegisterKidChurch(),
  },
  {
    key: '/kid-church',
    title: 'Iglekids',
    icon: <SmileO />,
    show: () => IsSupervisorKidChurch(),
  },
  {
    key: '/settings',
    title: 'Configuración',
    icon: <SettingO />,
    show: () => IsAllRole(),
  },
];

export const Layout = ({ children }: Props) => {
  const [paddingSize, setPaddingSize] = useState({ width: 0, height: 0 });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const TabBar = document.querySelector('.TabBarApp') as HTMLElement;
    if (TabBar) {
      const width = TabBar.offsetWidth;
      const height = TabBar.offsetHeight;
      setPaddingSize({ width, height });
    }
  }, []);

  return (
    <AuthWrapper>
      <div style={{ minHeight: '100vh' }}>
        <div
          style={{
            paddingBottom: paddingSize.height > 0 ? paddingSize.height : 50,
          }}
        >
          {children}
        </div>
        <Tabbar
          value={`/${pathname.split('/')[1]}`}
          onChange={(value) => router.push(value as string)}
          className="TabBarApp"
          // style={{
          //   position: 'fixed',
          //   bottom: '0',
          //   left: '0',
          //   width: '100%',
          //   backgroundColor: '#f5f5f5',
          // }}
        >
          {tabs.map((item) =>
            item.show() ? (

              <Tabbar.Item key={item.key} name={item.key} icon={item.icon}>
                {item.title}
              </Tabbar.Item>
            ) : null,
          )}
        </Tabbar>
      </div>
    </AuthWrapper>
  );
};
