import { Routes, Route, A } from "@solidjs/router";
import Register from "./register";
import Login from "./login";
import Home from "./home";
import { useUserContext } from "./user-store";
import Logout from "./logout";
import "./app.css";

export default function App() {
  const { token } = useUserContext();
  return (
    <>
      <nav>
        <A href="/">Home</A>
        {token() !== "" && <A href="/logout">Logout</A>}
        {token() === "" && (
          <>
            <A href="/login">Login</A> <A href="/register">Register</A>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
      </Routes>
    </>
  );
}
