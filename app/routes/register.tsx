import { LinksFunction, ActionFunction, Form, Link, useActionData } from "remix";
import { User } from "~/generated/graphql-schema";
import { createUser } from "~/modules/users.server";
import registerStyles from "../styles/routes/register.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: registerStyles},
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
      error: "Missing username or password",
    };
  }

  try {
    await createUser({username: username, password: password});
  }
  catch {
    return {
      error: "Invalid username or password. Maybe your password was too short?",
    };
  }

  return {};
};

export default function Register() {
  const response = useActionData<ActionData | null>();

  if (response && !response.error) {
    return (
      <>
        <h1>
          {"You've signed up! Go ahead and log right in!"}
        </h1>
        <p>
          <Link to="/login">Continue to log in</Link>
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
          { response?.error && <p className="error">{response.error}</p> }
          <button type="submit">{"Let's Go!"}</button>
        </Form>
      </div>
    );
  }
}
