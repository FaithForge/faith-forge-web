import {
  RootState,
  logout,
  resetChurchState,
  resetChurchMeetingState,
  resetChurchPrinterState,
} from '@/libs/state/redux';
import { parseJwt } from '@/libs/utils/jwt';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { Notify } from 'react-vant';

type Props = {
  children?: React.ReactNode;
};

const toastLogout = () => {
  Notify.show({
    type: 'success',
    message: 'Se ha cerrado su sesión',
    duration: 5000,
  });
};

export const AuthWrapper = ({ children }: Props) => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const authSlice = useSelector((state: RootState) => state.authSlice);

  if (!authSlice.token || authSlice.token === '') {
    push('/');
    dispatch(logout());
    toastLogout();
    return;
  }

  const decodedToken = parseJwt(authSlice.token);
  const currentTime = Date.now() / 1000;

  if (decodedToken.exp && decodedToken.exp < currentTime) {
    dispatch(resetChurchState());
    dispatch(resetChurchMeetingState());
    dispatch(resetChurchPrinterState());
    push('/');
    toastLogout();
    dispatch(logout());
  }

  return children;
};
