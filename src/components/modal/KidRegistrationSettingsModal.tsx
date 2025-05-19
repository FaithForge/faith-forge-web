import { SelectorOption } from '@/libs/common-types/global';
import {
  ChurchMeetingStateEnum,
  IChurch,
  IChurchMeeting,
  IChurchPrinter,
} from '@/libs/models';
import {
  AppDispatch,
  GetChurchMeetings,
  GetChurchPrinters,
  RootState,
  updateCurrentChurch,
  updateCurrentChurchMeeting,
  updateCurrentChurchPrinter,
} from '@/libs/state/redux';
import React, { useEffect } from 'react';
import { PiPrinter } from 'react-icons/pi';
import { useDispatch, useSelector } from 'react-redux';

const KidRegistrationSettingsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const churchSlice = useSelector((state: RootState) => state.churchSlice);
  const churchMeetingSlice = useSelector(
    (state: RootState) => state.churchMeetingSlice,
  );
  const churchPrinterSlice = useSelector(
    (state: RootState) => state.churchPrinterSlice,
  );

  useEffect(() => {
    const churchId = churchSlice.current?.id;

    if (churchId) {
      if (!churchMeetingSlice.current)
        dispatch(
          GetChurchMeetings({
            churchId,
            state: ChurchMeetingStateEnum.ACTIVE,
          }),
        );
      if (!churchPrinterSlice.current) dispatch(GetChurchPrinters(churchId));
    }
  }, []);

  const churchOptions: SelectorOption[] = churchSlice.data
    ? churchSlice.data.map((church: IChurch) => {
        return {
          id: church.id,
          name: church.name,
        };
      })
    : [];

  const churchMeetingOptions: SelectorOption[] = churchMeetingSlice.data
    ? churchMeetingSlice.data.map((churchMeeting: IChurchMeeting) => {
        return {
          id: churchMeeting.id,
          name: churchMeeting.name,
        };
      })
    : [];

  const churchPrinterOptions: SelectorOption[] = churchPrinterSlice.data
    ? churchPrinterSlice.data.map((churchPrinter: IChurchPrinter) => {
        return {
          id: churchPrinter.id,
          name: churchPrinter.name,
        };
      })
    : [];

  return (
    <dialog id="settingsKidRegistrationModal" className="modal modal-center">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="text-lg font-bold">Configuraciones</h3>
        <div className="py-4">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              <PiPrinter />
              Sede a registrar
            </legend>
            <select
              className="select"
              onChange={async (event) => {
                const churchId = event.target.value;
                await Promise.all([
                  dispatch(updateCurrentChurch(churchId)),
                  dispatch(GetChurchPrinters(churchId)),
                  dispatch(
                    GetChurchMeetings({
                      churchId,
                      state: ChurchMeetingStateEnum.ACTIVE,
                    }),
                  ),
                ]);
              }}
            >
              {churchOptions.map((churchOption: SelectorOption) => (
                <option
                  key={churchOption.id}
                  value={churchOption.id}
                  selected={churchOption.id === churchSlice.current?.id}
                >
                  {churchOption.name}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              {churchMeetingSlice.loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <PiPrinter />
                </>
              )}
              <span>Servicio a registrar</span>
            </legend>
            <select
              className="select"
              disabled={churchMeetingSlice.loading}
              onChange={async (event) => {
                const churchMeetingId = event.target.value;
                await dispatch(updateCurrentChurchMeeting(churchMeetingId));
              }}
            >
              {churchMeetingOptions.map((churchOption: SelectorOption) => (
                <option
                  key={churchOption.id}
                  value={churchOption.id}
                  selected={churchOption.id === churchMeetingSlice.current?.id}
                >
                  {churchOption.name}
                </option>
              ))}
            </select>
          </fieldset>
          <div className="divider"></div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              {churchMeetingSlice.loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <>
                  <PiPrinter />
                </>
              )}
              <span>Impresora a usar</span>
            </legend>
            <select
              className="select"
              disabled={
                churchMeetingSlice.loading || churchPrinterSlice.loading
              }
              onChange={async (event) => {
                const churchPrinterId = event.target.value;
                await dispatch(updateCurrentChurchPrinter(churchPrinterId));
              }}
            >
              {churchPrinterOptions.map((churchOption: SelectorOption) => (
                <option
                  key={churchOption.id}
                  value={churchOption.id}
                  selected={churchOption.id === churchPrinterSlice.current?.id}
                >
                  {churchOption.name}
                </option>
              ))}
            </select>
          </fieldset>
          <div className="divider"></div>
          <form method="dialog">
            <button className="btn btn-block btn-success">Finalizar</button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default KidRegistrationSettingsModal;
