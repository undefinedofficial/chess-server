import ConnectionContext from "./ConnectionContext";

interface UserData {
  connectionContext: ConnectionContext;
  done?: boolean;
}
export default UserData;
