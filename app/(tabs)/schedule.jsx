import { useContext } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import RiderSchedule from '../pages/RiderSchedule';
import DriverSchedule from '../pages/DriverSchedule';

export default function Schedule() {
  const { userDetail } = useContext(UserDetailContext);
  const isDriver = userDetail?.driver;

  return isDriver ? <DriverSchedule /> : <RiderSchedule />;
}