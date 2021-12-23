import { Form } from "remix";
import { createNftClass } from "../../graphql/resolvers/stacks";

export const action = async () => {
  const resp = await createNftClass();

  console.log("Response", resp);

  return resp;
};

export default function TestStacks() {
  return (
    <Form method="post">
      <input type="submit" value="Depl" />
    </Form>
  );
}
