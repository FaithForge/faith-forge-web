import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/user/auth.slice';
import { parseJwt } from '@/utils/jwt';
import { Toast } from 'antd-mobile';

type Props = {
  children?: React.ReactNode;
};

const toastLogout = () => {
  Toast.show({
    content: 'Se ha cerrado su sesión',
    position: 'bottom',
    duration: 5000,
  });
};

export const AuthWrapper = ({ children }: Props) => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const authSlice = useSelector((state: RootState) => state.authSlice);

  if (!authSlice.token || authSlice.token === '') {
    push('/login');
    dispatch(logout());
    toastLogout();
    return;
  }

  const decodedToken = parseJwt(authSlice.token);
  const currentTime = Date.now() / 1000;

  if (decodedToken.exp && decodedToken.exp < currentTime) {
    push('/login');
    toastLogout();
    dispatch(logout());
  }

  return children;
};
