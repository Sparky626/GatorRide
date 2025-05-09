import { useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import RiderHome from "../pages/RiderHome";
import DriverHome from "../pages/DriverHome";

export default function Home() {
  const { userDetail } = useContext(UserDetailContext);
  const isDriver = userDetail?.driver;

  return isDriver ? <DriverHome /> : <RiderHome />;
}
