import { For, createResource } from "solid-js";
import { useUserContext } from "./user-store";
import { user } from "./api-client";
import { useNavigate } from "@solidjs/router";

export default function Home() {
  const { token } = useUserContext();
  const navigate = useNavigate();

  if (token() === "") {
    navigate("/login", { replace: true });
  }

  async function fetchData() {
    const t = token();
    if (t !== "") {
      return await user(token());
    }
    return Promise.reject();
  }

  const [data] = createResource(token, fetchData);

  return (
    <>
      <h2>Home</h2>
      {data.loading && <h2>Loading...</h2>}
      {data.error && <h2>Loading failed</h2>}
      {data() && (
        <>
          <h2>Hello {data().email}</h2>
          <ul>
            <For each={data().sports}>{(sport) => <li>{sport}</li>}</For>
          </ul>
        </>
      )}
    </>
  );
}
