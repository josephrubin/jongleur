import { ActionFunction, LoaderFunction, Form, redirect, useActionData } from "remix";
import { deleteUserSessionRedirect } from "~/modules/users.server";

export const action: ActionFunction = async ({request}) => {
  return deleteUserSessionRedirect(request, "/");
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
