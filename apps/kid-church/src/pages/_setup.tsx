/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { Button, Cell, Popup, Radio, Skeleton, Steps, Toast } from 'react-vant';
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
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { FaRegCheckCircle } from 'react-icons/fa';

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
  }, [authSlice.token, dispatch]);

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
          <Steps active={step} activeColor="#397b9d">
            <Steps.Item>Sede</Steps.Item>
            <Steps.Item>Servicio</Steps.Item>
            <Steps.Item>Impresora</Steps.Item>
            <Steps.Item>Grupo</Steps.Item>
          </Steps>
          {step === 0 && (
            <>
              <h2>Selecciona sede</h2>

              <Radio.Group value={church} onChange={() => setStep(1)}>
                <Cell.Group>
                  {churchSlice?.loading ? (
                    <Skeleton
                      row={4}
                      rowHeight={25}
                      style={{ marginTop: 5, marginBottom: 5 }}
                    />
                  ) : (
                    churchOptions.map((churchOption: any) => (
                      <Cell
                        key={churchOption.value}
                        clickable
                        title={churchOption.label}
                        onClick={() => {
                          setChurch(churchOption.value);
                          setStep(1);
                        }}
                        rightIcon={<Radio name={churchOption.value} />}
                      />
                    ))
                  )}
                </Cell.Group>
              </Radio.Group>

              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button
                  onClick={() =>
                    church
                      ? setStep(1)
                      : Toast.info({
                          message: 'Elige una opción',
                          position: 'bottom',
                        })
                  }
                  iconPosition="right"
                  icon={<MdKeyboardArrowRight />}
                >
                  Siguiente
                </Button>
              </Button.Group>
            </>
          )}
          {step === 1 && (
            <>
              <h2>
                Selecciona Reunión de{' '}
                {
                  churchOptions.find(
                    (churchOption) => churchOption.value === church,
                  )?.label
                }
              </h2>

              <Radio.Group value={churchMeeting} onChange={() => setStep(2)}>
                <Cell.Group>
                  {churchMeetingSlice?.loading ? (
                    <Skeleton
                      row={4}
                      rowHeight={25}
                      style={{ marginTop: 5, marginBottom: 5 }}
                    />
                  ) : (
                    churchMeetingOptions.map((churchOption: any) => (
                      <Cell
                        key={churchOption.value}
                        clickable
                        title={churchOption.label}
                        onClick={() => {
                          setChurchMeeting(churchOption.value);
                          setStep(2);
                        }}
                        rightIcon={<Radio name={churchOption.value} />}
                      />
                    ))
                  )}
                </Cell.Group>
              </Radio.Group>
              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button
                  onClick={() => setStep(0)}
                  iconPosition="left"
                  icon={<MdKeyboardArrowLeft />}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() =>
                    churchMeeting
                      ? setStep(2)
                      : Toast.info({
                          message: 'Elige una opción',
                          position: 'bottom',
                        })
                  }
                  iconPosition="right"
                  icon={<MdKeyboardArrowRight />}
                >
                  Siguiente
                </Button>
              </Button.Group>
            </>
          )}
          {step === 2 && (
            <>
              <h2>
                Selecciona Impresora de{' '}
                {
                  churchOptions.find(
                    (churchOption) => churchOption.value === church,
                  )?.label
                }
              </h2>

              <Radio.Group value={churchPrinter} onChange={() => setStep(3)}>
                <Cell.Group>
                  {churchPrinterSlice?.loading ? (
                    <Skeleton
                      row={4}
                      rowHeight={25}
                      style={{ marginTop: 5, marginBottom: 5 }}
                    />
                  ) : (
                    churchPrinterOptions.map((churchOption: any) => (
                      <Cell
                        key={churchOption.value}
                        clickable
                        title={churchOption.label}
                        onClick={() => {
                          setChurchPrinter(churchOption.value);
                          setStep(3);
                        }}
                        rightIcon={<Radio name={churchOption.value} />}
                      />
                    ))
                  )}
                </Cell.Group>
              </Radio.Group>
              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button
                  onClick={() => setStep(1)}
                  iconPosition="left"
                  icon={<MdKeyboardArrowLeft />}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() =>
                    churchPrinter
                      ? setStep(3)
                      : Toast.info({
                          message: 'Elige una opción',
                          position: 'bottom',
                        })
                  }
                  iconPosition="right"
                  icon={<MdKeyboardArrowRight />}
                >
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
                      key={churchOption}
                      clickable
                      title={churchOption}
                      onClick={() => setChurchGroup(churchOption)}
                      rightIcon={<Radio name={churchOption} />}
                    />
                  ))}
                </Cell.Group>
              </Radio.Group>
              <Button.Group block style={{ width: '99%', marginTop: 10 }}>
                <Button
                  onClick={() => setStep(2)}
                  iconPosition="left"
                  icon={<MdKeyboardArrowLeft />}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() =>
                    churchGroup
                      ? onFinish()
                      : Toast.info({
                          message: 'Elige una opción',
                          position: 'bottom',
                        })
                  }
                  iconPosition="right"
                  icon={<FaRegCheckCircle />}
                >
                  Finalizar
                </Button>
              </Button.Group>
            </>
          )}
        </div>
      </Popup>
    </>
  );
};

export default Setup;
