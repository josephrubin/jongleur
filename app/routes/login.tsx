import { LinksFunction, ActionFunction, Form, redirect, useActionData } from "remix";
import { createJongSession, createSessionRedirectResponse } from "~/modules/session.server";
import loginStyles from "../styles/routes/login.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: loginStyles},
  ];
};

interface ActionData {
  readonly error?: string;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const username = String(formData.get("username"));
  const password = String(formData.get("password"));

  if (!username || !password) {
    return {
      error: "Missing username or password.",
    };
  }

  const session = await createJongSession({username: username, password: password});

  if (session && session.accessToken) {
    return await createSessionRedirectResponse(session, "/");
  }
  else {
    return {
      error: "Incorrect login information. Please try again.",
    };
  }
};

export default function Login() {
  const response = useActionData<ActionData | null>();

  return (
    <div>
      <h1>🎻&nbsp; {"Let's Get Practicing!"}</h1>
      <Form method="post">
        <label>
          Username
          <input name="username" type="text" />
        </label>
        <label>
          Password
          <input name="password" type="password" />
        </label>
        { response?.error && <p className="error">{response.error}</p> }
        <button type="submit">Carry On!</button>
      </Form>
    </div>
  );
}
