import { ActionFunction, LoaderFunction, Form, redirect, useActionData } from "remix";
import { deleteSessionRedirectResponse } from "~/modules/session.server";

export const action: ActionFunction = async ({request}) => {
  return await deleteSessionRedirectResponse(request, "/");
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
