import { ActionFunction, Form, redirect, useActionData } from "remix";
import { createUser } from "~/modules/users.server";
import registerStyles from "../styles/routes/register.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: registerStyles},
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const username = String(formData.get("username")!);
  const password = String(formData.get("password")!);

  // For now we assume no errors. TODO - fix this.

  const user = await createUser({username: username, password: password});

  return user;
};

export default function Register() {
  const user = useActionData();
  if (user) {
    return (
      <>
        <p>
          You've signed up! Here are the details:
        </p>
        <p>
          {JSON.stringify(user)}
        </p>
      </>
    );
  }
  else {
    return (
      <div className="register-container">
        <h1>🎶&nbsp; Music Awaits! Join Us!</h1>
        <Form method="post">
          <label>
          Username
            <input name="username" type="text" />
          </label>
          <label>
          Password
            <input name="password" type="password" />
          </label>
          <input type="submit" value="Let's Go!" />
        </Form>
      </div>
    );
  }
}
