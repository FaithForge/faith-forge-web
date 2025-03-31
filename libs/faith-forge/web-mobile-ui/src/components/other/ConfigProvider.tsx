import { ConfigProvider as ConfigProviderComponent } from 'react-vant';
import { BaseTypeProps } from '../../utils/interface';

export interface ConfigProviderProps extends BaseTypeProps {
  themeVars?: Record<string, string | number>;
}

const ConfigProvider = ({ children, ...props }: ConfigProviderProps) => {
  return (
    <ConfigProviderComponent {...props}>{children}</ConfigProviderComponent>
  );
};

export default ConfigProvider;
export { ConfigProvider };
