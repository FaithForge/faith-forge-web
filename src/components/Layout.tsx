import { useEffect, useState } from 'react';
import { SettingOutlined, AuditOutlined } from '@ant-design/icons';
import { TabBar } from 'antd-mobile';
import { usePathname, useRouter } from 'next/navigation';
import { AuthWrapper } from './AuthWrapper';

type Props = {
  children?: React.ReactNode;
};

const tabs = [
  {
    key: '/registration',
    title: 'Registro',
    icon: <AuditOutlined />,
  },
  {
    key: '/settings',
    title: 'Configuración',
    icon: <SettingOutlined />,
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
        <TabBar
          activeKey={`/${pathname.split('/')[1]}`}
          onChange={(value) => router.push(value)}
          style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            backgroundColor: '#f5f5f5',
          }}
          className="TabBarApp"
        >
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </AuthWrapper>
  );
};
