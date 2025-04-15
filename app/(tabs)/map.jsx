import { useContext } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import RiderMap from '../pages/RiderMap';
import DriverMap from '../pages/DriverMap';

export default function Map() {
  const { userDetail } = useContext(UserDetailContext);
  const isDriver = userDetail?.driver;

  return isDriver ? <DriverMap /> : <RiderMap />;
}