/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { Button, Cell, Popup, Radio, Steps } from 'react-vant';
import { churchGroup as churchGroupOptions } from '@faith-forge-web/common-types/constants';
import { IsRegisterKidChurch } from '../utils/auth';
import { parseJwt } from '../utils/jwt';
import {
  AppDispatch,
  GetChurches,
  GetChurchMeetings,
  GetChurchPrinters,
  RootState,
  updateCurrentChurch,
  updateCurrentChurchMeeting,
  updateCurrentChurchPrinter,
  updateUserChurchGroup,
} from '@faith-forge-web/state/redux';
import { ChurchMeetingStateEnum } from '@faith-forge-web/models';

const Setup: NextPage = () => {
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const accountSlice = useSelector((state: RootState) => state.accountSlice);
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );

  // useState
  const [step, setStep] = useState(0);
  const [church, setChurch] = useState<string>();
  const [churchMeeting, setChurchMeeting] = useState<string>();
  const [churchGroup, setChurchGroup] = useState<string>();
  const [churchPrinter, setChurchPrinter] = useState<string>();

  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const isRegisterKidChurch = IsRegisterKidChurch();
  const dispatch = useDispatch<AppDispatch>();

  const onFinish = async () => {
    if (church && churchMeeting && churchGroup) {
      await dispatch(updateCurrentChurch(church));
      await dispatch(updateCurrentChurchMeeting(churchMeeting));
      await dispatch(updateUserChurchGroup(churchGroup));

      if (churchPrinter && isRegisterKidChurch) {
        await dispatch(updateCurrentChurchPrinter(churchPrinter));
      }

      router.reload();
    }
  };

  useEffect(() => {
    if (authSlice.token || authSlice.token !== '') {
      const decodedToken = parseJwt(authSlice.token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp && decodedToken.exp >= currentTime) {
        if (
          !churchSlice.current ||
          !churchMeetingSlice.current ||
          (!churchPrinterSlice.current && isRegisterKidChurch) ||
          !accountSlice.churchGroup
        ) {
          setVisible(true);
          dispatch(GetChurches(false));
        }
        return;
      }

      setVisible(false);
      return;
    }

    setVisible(false);
  }, [
    accountSlice.churchGroup,
    authSlice.token,
    churchMeetingSlice,
    churchPrinterSlice,
    churchSlice,
    dispatch,
    isRegisterKidChurch,
  ]);

  useEffect(() => {
    if (church) {
      dispatch(
        GetChurchMeetings({
          churchId: church,
          state: ChurchMeetingStateEnum.ACTIVE,
        }),
      );
      dispatch(GetChurchPrinters(church));
    }
  }, [church, dispatch]);

  const churchOptions = churchSlice.data
    ? churchSlice.data.map((church: any) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const churchMeetingOptions = churchMeetingSlice.data
    ? churchMeetingSlice.data.map((church: any) => {
        return {
          label: church.name,
          value: church.id,
        };
      })
    : [];

  const churchPrinterOptions = churchPrinterSlice.data
    ? churchPrinterSlice.data.map((churchPrinter: any) => {
        return {
          label: churchPrinter.name,
          value: churchPrinter.id,
        };
      })
    : [];

  return (
    <>
      <Popup visible={visible} position="bottom" style={{ height: '90%' }}>
        <div style={{ padding: 5 }}>
          <h2 style={{ textAlign: 'center' }}>Configuración Inicial</h2>
          <Steps active={step}>
            <Steps.Item>Sede</Steps.Item>
            <Steps.Item>Servicio</Steps.Item>
            <Steps.Item>Impresora</Steps.Item>
            <Steps.Item>Grupo</Steps.Item>
          </Steps>
          {step === 0 && (
            <>
              <h2>Selecciona Sede</h2>

              <Radio.Group value={church}>
                <Cell.Group>
                  {churchOptions.map((churchOption: any) => (
                    <Cell
                      key={churchOption.value}
                      clickable
                      title={churchOption.label}
                      onClick={() => setChurch(churchOption.value)}
                      rightIcon={<Radio name={churchOption.value} />}
                    />
                  ))}
                </Cell.Group>
              </Radio.Group>

              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button onClick={() => church && setStep(1)}>Siguiente</Button>
              </Button.Group>
            </>
          )}
          {step === 1 && (
            <>
              <h2>Selecciona Reunión</h2>

              <Radio.Group value={churchMeeting}>
                <Cell.Group>
                  {churchMeetingOptions.map((churchOption: any) => (
                    <Cell
                      key={churchOption.value}
                      clickable
                      title={churchOption.label}
                      onClick={() => setChurchMeeting(churchOption.value)}
                      rightIcon={<Radio name={churchOption.value} />}
                    />
                  ))}
                </Cell.Group>
              </Radio.Group>
              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button onClick={() => setStep(0)}>Anterior</Button>
                <Button onClick={() => churchMeeting && setStep(2)}>
                  Siguiente
                </Button>
              </Button.Group>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Selecciona Impresora</h2>

              <Radio.Group value={churchPrinter}>
                <Cell.Group>
                  {churchPrinterOptions.map((churchOption: any) => (
                    <Cell
                      key={churchOption.value}
                      clickable
                      title={churchOption.label}
                      onClick={() => setChurchPrinter(churchOption.value)}
                      rightIcon={<Radio name={churchOption.value} />}
                    />
                  ))}
                </Cell.Group>
              </Radio.Group>
              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button onClick={() => setStep(1)}>Anterior</Button>
                <Button onClick={() => churchPrinter && setStep(3)}>
                  Siguiente
                </Button>
              </Button.Group>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Selecciona Grupo</h2>

              <Radio.Group value={churchGroup}>
                <Cell.Group>
                  {churchGroupOptions.map((churchOption) => (
                    <Cell
                      key={churchOption.value}
                      clickable
                      title={churchOption.label}
                      onClick={() => setChurchGroup(churchOption.value)}
                      rightIcon={<Radio name={churchOption.value} />}
                    />
                  ))}
                </Cell.Group>
              </Radio.Group>
              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button onClick={() => setStep(2)}>Anterior</Button>
                <Button onClick={() => onFinish()}>Siguiente</Button>
              </Button.Group>
            </>
          )}
        </div>
      </Popup>
    </>
  );
};

export default Setup;
