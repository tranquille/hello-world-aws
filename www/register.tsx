import { Accessor, Setter, createSignal } from "solid-js";
import { register } from "./api-client";
import { useNavigate } from "@solidjs/router";

export default function Register() {
  const [sports, setSports]: [
    sports: Accessor<Array<string>>,
    setSports: Setter<Array<string>>
  ] = createSignal([]);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [hasError, setError] = createSignal("");

  const navigate = useNavigate();

  const handleSports = (e: string) => {
    const s = e.split(",");
    setSports(s);
  };

  const handleSubmit = async () => {
    setError("");
    try {
      console.log(sports());
      const registerResult = await register(email(), password(), sports());

      if (registerResult.name) {
        switch (registerResult.name) {
          case "UsernameExistsException":
            setError("Username exists");
            break;
          case "InvalidPasswordException":
            setError("Password is invalid");
            break;
          default:
            setError("Registration failed...");
        }
        return;
      }

      navigate("/", { replace: true });
    } catch (error: unknown) {
      setError("Regestration failed...");
      console.log("asdsad");
      console.error(error);
    }
  };

  return (
    <>
      <h2>Register</h2>
      <div>
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={email()}
          onInput={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={password()}
          onInput={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          name="sports"
          type="text"
          placeholder="Sports - comma separated"
          onInput={(e) => handleSports(e.target.value)}
          required
        />
      </div>
      <div>
        <button onClick={() => handleSubmit()}>Submit</button>
      </div>
      {hasError() && <span>{hasError()}</span>}
    </>
  );
}
