import Cell from '@/components/Cell';
import HomeNavBar from '@/components/navbar/HomeNavBar';
import { RootState } from '@/libs/state/redux';
import { capitalizeWords } from '@/libs/utils/text';
import type { NextPage } from 'next';
import { IoIosArrowForward } from 'react-icons/io';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { PiCheckCircleFill, PiCheckFatFill, PiXCircleFill } from 'react-icons/pi';
import { Layout } from '@/components/Layout';

const KidChurchAttendance: NextPage = () => {
  const churchCampusSlice = useSelector((state: RootState) => state.churchCampusSlice);
  const churchMeetingSlice = useSelector((state: RootState) => state.churchMeetingSlice);

  return (
    <Layout>
      <HomeNavBar />
      <div className="pb-16">
        <div className="p-2 sticky top-14 z-80 bg-white">
          <h2 className="text-lg font-bold py-2">Información del grupo y servicio (Obligatorio)</h2>
          <p>
            <span className="font-bold">Sede:</span> {churchCampusSlice.current?.name}
          </p>
          <p>
            <span className="font-bold">Reunión:</span> {churchMeetingSlice.current?.name}
          </p>
          <select className="select w-full my-2">
            <option disabled selected>
              Selecciona un area a tomar asistencia
            </option>
            <option>Regikids</option>
            <option>Zaqueos</option>
            <option>Jeremias</option>
          </select>
        </div>
        <ul className="list bg-base-100 rounded-box">
          {Array.from({ length: 50 }).map((_, index) => (
            <Cell
              key={`cell-${index}`}
              title={`Juan Carlos Peña ${index + 1}`}
              icon={
                <img
                  alt={`Juan Carlos Peña ${index + 1}`}
                  className="size-10 rounded-box"
                  src={'/icons/boy-v2.png'}
                />
              }
              label={'Supervisor'}
              bgColorClass={'bg-neutral-200'}
              bgHoverColorClass={'hover:bg-neutral-300'}
              onClick={() => console.log(`Clicked: ${index + 1}`)}
              iconRight={
                <label className="swap swap-rotate">
                  <input type="checkbox" />

                  <PiCheckCircleFill
                    className="swap-off h-10 w-10 fill-current"
                    style={{
                      height: '3em',
                      width: '2.2em',
                    }}
                  />

                  <PiXCircleFill
                    className="swap-on h-10 w-10 fill-current"
                    style={{
                      height: '3em',
                      width: '2.2em',
                    }}
                  />
                </label>
              }
            />
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default KidChurchAttendance;
