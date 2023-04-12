import { useNavigate } from "@solidjs/router";
import { useUserContext } from "./user-store";

export default function Logout() {
  const { token, setToken } = useUserContext();
  const navigate = useNavigate();
  if (token() !== "") {
    setToken("");
  }
  navigate("/", { replace: true });

  return <></>;
}
