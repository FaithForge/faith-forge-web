import { Button as ButtonComponent } from 'react-vant';
import { BaseTypeProps } from '../../utils/interface';

export enum ButtonType {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
}

export enum ButtonSize {
  LARGE = 'large',
  NORMAL = 'normal',
  SMALL = 'small',
  MINI = 'mini',
}

export interface ButtonProps extends BaseTypeProps {
  type?: ButtonType;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  block?: boolean;
  nativeType?: string;
  size?: ButtonSize;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const Button = ({ children, ...props }: ButtonProps) => {
  return <ButtonComponent {...props}>{children}</ButtonComponent>;
};

export default Button;
export { Button };
