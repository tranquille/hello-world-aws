const API_ROOT = "/stage";

async function send(method: string, url: string, data: unknown) {
  const headers: HeadersInit = {};
  const opts: RequestInit = { method, headers };

  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(API_ROOT + url, opts);
    if (response.status === 201) {
      return {};
    }
    const json = await response.json();
    return json;
  } catch (err: any) {
    return err;
  }
}

export const user = async (token: string) => send("POST", "/user", { token });

export const register = async (
  email: string,
  password: string,
  sports: Array<string>,
) => send("POST", "/register", { email, password, sports });

export const login = async (email: string, password: string) =>
  send("POST", "/login", { email, password });
