import { useEffect, useState } from 'react';
import {
  SettingOutlined,
  AuditOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { TabBar } from 'antd-mobile';
import { usePathname, useRouter } from 'next/navigation';
import { AuthWrapper } from './AuthWrapper';
import {
  IsAllRole,
  IsRegisterKidChurch,
  IsSupervisorKidChurch,
} from '@/utils/auth';

type Props = {
  children?: React.ReactNode;
};

const tabs = [
  {
    key: '/registration',
    title: 'Registro',
    icon: <AuditOutlined />,
    show: () => IsRegisterKidChurch(),
  },
  {
    key: '/kid-church',
    title: 'Iglekids',
    icon: <SmileOutlined />,
    show: () => IsSupervisorKidChurch(),
  },
  {
    key: '/settings',
    title: 'Configuración',
    icon: <SettingOutlined />,
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
        <TabBar
          activeKey={`/${pathname.split('/')[1]}`}
          onChange={(value) => router.push(value)}
          style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            backgroundColor: '#ffffff',
            borderTop: '1px solid var(--adm-color-border)',
          }}
          className="TabBarApp"
        >
          {tabs.map((item) =>
            item.show() ? (
              <TabBar.Item
                key={item.key}
                icon={item.icon}
                title={item.title}
                style={{ padding: '8px 8px' }}
              />
            ) : null,
          )}
        </TabBar>
      </div>
    </AuthWrapper>
  );
};
