import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthWrapper } from './AuthWrapper';
import { Search, SettingO, SmileO } from '@react-vant/icons';
import {
  IsAllRole,
  IsRegisterKidChurch,
  IsSupervisorKidChurch,
  UserRole,
} from '@/libs/utils/auth';
import { PiGearSix, PiPlusCircle, PiPrinter, PiQrCode } from 'react-icons/pi';
import KidRegistrationSettingsModal from './modal/KidRegistrationSettingsModal';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/state/redux';
import KidRegistrationLayout from './layouts/KidRegistrationLayout';
import React from 'react';
import DefaultLayout from './layouts/DefaultLayout';
import KidChurchLayout from './layouts/KidChurchLayout';
import AdminLayout from './layouts/AdminLayout';

type Props = {
  children?: React.ReactNode;
};

const tabs = [
  {
    key: '/registration',
    title: 'Registro',
    icon: <Search />,
    show: () => IsRegisterKidChurch(),
  },
  {
    key: '/kid-church',
    title: 'Iglekids',
    icon: <SmileO />,
    show: () => IsSupervisorKidChurch(),
  },
  {
    key: '/settings',
    title: 'Configuración',
    icon: <SettingO />,
    show: () => IsAllRole(),
  },
];

const userRoleLayoutMap: Record<
  UserRole,
  React.ComponentType<{ children: React.ReactNode }>
> = {
  [UserRole.KID_REGISTER_ADMIN]: KidRegistrationLayout,
  [UserRole.KID_REGISTER_SUPERVISOR]: KidRegistrationLayout,
  [UserRole.KID_REGISTER_USER]: KidRegistrationLayout,
  [UserRole.KID_GROUP_ADMIN]: KidChurchLayout,
  [UserRole.KID_GROUP_SUPERVISOR]: KidChurchLayout,
  [UserRole.KID_GROUP_USER]: KidChurchLayout,
  [UserRole.SUPER_ADMIN]: AdminLayout,
  [UserRole.ADMIN]: AdminLayout,
  [UserRole.STAFF]: DefaultLayout,
  [UserRole.KID]: DefaultLayout,
  [UserRole.USER]: DefaultLayout,
  [UserRole.KID_CHURCH_ADMIN]: DefaultLayout,
};

export const Layout = ({ children }: Props) => {
  const authSlice = useSelector((state: RootState) => state.authSlice);
  const currentRole = authSlice.currentRole;

  let layoutComponent = currentRole && userRoleLayoutMap[currentRole];
  let LayoutComponent = layoutComponent as React.ComponentType<{
    children: React.ReactNode;
  }>;

  return (
    <AuthWrapper>
      <LayoutComponent>{children}</LayoutComponent>
    </AuthWrapper>
  );
};
