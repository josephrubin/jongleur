import { LinksFunction, ActionFunction, Form, redirect, useActionData } from "remix";
import { createJongSession, createSessionRedirectResponse } from "~/modules/session.server";
import loginStyles from "../styles/routes/login.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: loginStyles},
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const username = String(formData.get("username")!);
  const password = String(formData.get("password")!);

  // For now we assume no errors. TODO - fix this.

  const session = await createJongSession({username: username, password: password});

  if (session && session.accessToken) {
    return await createSessionRedirectResponse(session, "/");
  }
  else {
    return {
      error: "Could not make session",
    };
  }
};

export default function Register() {
  const actionData = useActionData();

  if (actionData && actionData.error) {
    return (
      <p>
        {actionData.error}
      </p>
    );
  }

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
        <button type="submit">Carry On!</button>
      </Form>
    </div>
  );
}
