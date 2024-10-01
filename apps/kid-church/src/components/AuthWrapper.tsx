import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { Toast } from 'react-vant';
import { resetChurchState } from '../redux/slices/church/church.slice';
import { resetChurchMeetingState } from '../redux/slices/church/churchMeeting.slice';
import { resetChurchPrinterState } from '../redux/slices/church/churchPrinter.slice';
import { logout } from '../redux/slices/user/auth.slice';
import { RootState } from '../redux/store';
import { parseJwt } from '../utils/jwt';

type Props = {
  children?: React.ReactNode;
};

const toastLogout = () => {
  Toast.info({
    message: 'Se ha cerrado su sesión',
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
    dispatch(resetChurchState());
    dispatch(resetChurchMeetingState());
    dispatch(resetChurchPrinterState());
    push('/login');
    toastLogout();
    dispatch(logout());
  }

  return children;
};
