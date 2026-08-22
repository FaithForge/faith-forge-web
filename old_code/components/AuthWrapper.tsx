import {
  RootState,
  logout,
  resetChurchCampusState,
  resetChurchMeetingState,
  resetChurchPrinterState,
} from '@/libs/state/redux';
import { parseJwt } from '@/libs/utils/jwt';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

type Props = {
  children?: React.ReactNode;
};

const toastLogout = () => {
  toast.success('Se ha cerrado su sesión', {
    duration: 5000,
    style: {
      color: 'white',
    },
  });
};

export const AuthWrapper = ({ children }: Props) => {
  const dispatch = useDispatch();
  const { push } = useRouter();
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const handledInvalidTokenRef = useRef<string | null>(null);

  let isSessionInvalid = false;

  if (!authSlice.token || authSlice.token === '') {
    isSessionInvalid = true;
  } else {
    try {
      const decodedToken = parseJwt(authSlice.token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp && decodedToken.exp < currentTime) {
        isSessionInvalid = true;
      }
    } catch {
      isSessionInvalid = true;
    }
  }

  useEffect(() => {
    if (!isSessionInvalid) {
      handledInvalidTokenRef.current = null;
      return;
    }

    if (authSlice.token === '' && handledInvalidTokenRef.current !== null) {
      return;
    }

    if (handledInvalidTokenRef.current === authSlice.token) {
      return;
    }

    handledInvalidTokenRef.current = authSlice.token ?? '';

    if (authSlice.token) {
      dispatch(resetChurchCampusState());
      dispatch(resetChurchMeetingState());
      dispatch(resetChurchPrinterState());
    }

    dispatch(logout());
    toastLogout();
    void push('/');
  }, [authSlice.token, dispatch, isSessionInvalid, push]);

  if (isSessionInvalid) {
    return null;
  }

  return children;
};
