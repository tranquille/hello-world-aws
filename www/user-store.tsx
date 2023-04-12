import {
  Accessor,
  Setter,
  createContext,
  createSignal,
  useContext,
} from "solid-js";

interface UserContextProps {
  token: Accessor<string>;
  setToken: Setter<string>;
}

const UserContext = createContext<UserContextProps>();

export function UserContextProvider(props: any) {
  const [token, setToken] = createSignal("");

  return (
    <UserContext.Provider
      value={{
        token,
        setToken,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}

// We have to tell typescript that the context is defined to prevent
// undefined value errors everywhere we use the context
// Therefore we use the ! at the end of useContext
export const useUserContext = () => useContext(UserContext)!;
