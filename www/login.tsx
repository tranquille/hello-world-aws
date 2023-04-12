import { createSignal, onMount } from "solid-js";
import { useUserContext } from "./user-store";
import { useNavigate } from "@solidjs/router";
import { login } from "./api-client";

export default function Login() {
  const { token, setToken } = useUserContext();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [hasError, setError] = createSignal(false);
  const navigate = useNavigate();

  if (token() !== "") {
    navigate("/", { replace: true });
  }

  const handleSubmit = async () => {
    setError(false);
    try {
      const loginResult = await login(email(), password());

      if (loginResult?.AccessToken) {
        setToken(loginResult.AccessToken);
        navigate("/", { replace: true });
      } else {
        setToken("");
        setError(true);
      }
    } catch (error: unknown) {
      setToken("");
      setError(true);
      console.error(error);
    }
  };

  return (
    <>
      <h2>Login</h2>
      <input
        name="username"
        type="text"
        placeholder="Username"
        value={email()}
        onInput={(e) => setEmail(e.target.value)}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={password()}
        onInput={(e) => setPassword(e.target.value)}
        required
      />
      <button onClick={() => handleSubmit()}>Log in</button>
      {hasError() ? <h3>Login failed!</h3> : undefined}
    </>
  );
}
