import type { NextPage } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import LoadingMask from '../../components/LoadingMask';
import { capitalizeWords } from '../../utils/text';
import { Cell, List, Search, Image, Empty } from 'react-vant';
import NavBarApp from '../../components/NavBarApp';
import { withRoles } from '../../components/Permissions';
import { UserRole, AdminRoles } from '../../utils/auth';
import { Layout } from '../../components/Layout';
import {
  RootState,
  AppDispatch,
  updateCurrentUser,
  GetMoreUsers,
  GetUsers,
} from '@faith-forge-web/state/redux';
import { IUser, UserGenderCode } from '@faith-forge-web/models';

const Users: NextPage = () => {
  const {
    data: users,
    currentPage,
    totalPages,
    loading,
  } = useSelector((state: RootState) => state.userSlice);

  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const router = useRouter();
  const [findText, setFindText] = useState('');

  useEffect(() => {
    dispatch(GetUsers({ findText }));
  }, [dispatch, findText, pathname]);

  const getMoreUsers = async () => {
    dispatch(GetMoreUsers({ findText }));
  };

  const editUserViewHandler = (user: IUser) => {
    dispatch(updateCurrentUser(user));
    router.push(`/settings/users/edit`);
  };

  return (
    <Layout>
      {loading ? <LoadingMask /> : ''}
      <NavBarApp title="Listado Usuarios" />

      <Search
        // showCancelButton
        // cancelText="Cancelar"
        placeholder="Buscar Niño"
        onSearch={(value) => setFindText(value)}
        onCancel={() => setFindText('')}
        // icon={<SearchOutlined />}
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 2,
          height: '49px',
          padding: '10px 5px',
          backgroundColor: 'white',
        }}
      />
      <List onLoad={getMoreUsers} finished={currentPage >= totalPages}>
        {users.length ? (
          users.map((user: any) => (
            <Cell
              key={user.faithForgeId}
              icon={
                <Image
                  alt={`${user.firstName} ${user.lastName}`}
                  src={
                    user.photoUrl
                      ? user.photoUrl
                      : user.roles?.find((role: any) => role === UserRole.KID)
                        ? user.gender === UserGenderCode.MALE
                          ? '/icons/boy-v2.png'
                          : '/icons/girl-v2.png'
                        : user.gender === UserGenderCode.MALE
                          ? '/icons/male.png'
                          : '/icons/female.png'
                  }
                  style={{ borderRadius: 20 }}
                  fit="cover"
                  width={40}
                  height={40}
                />
              }
              title={capitalizeWords(`${user.firstName} ${user.lastName}`)}
              label={`Codigo: ${user.faithForgeId}`}
              onClick={() => editUserViewHandler(user)}
            />
          ))
        ) : (
          <Empty description="No se encontraron registros" />
        )}
      </List>

      {/* <FloatingBubble
        style={{
          '--initial-position-bottom': '70px',
          '--initial-position-right': '20px',
          '--edge-distance': '24px',
        }}
        onClick={() => router.push('/registration/newKid')}
      >
        <UserAddOutlined style={{ fontSize: '28px' }} />
      </FloatingBubble> */}
    </Layout>
  );
};

export default withRoles(Users, AdminRoles);
