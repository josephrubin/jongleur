import { useState } from "react";
import { Form, ActionFunction, redirect, useMatches } from "remix";
import { AssignmentType, CollectionInput, MediaType } from "~/generated/graphql-schema";
import { createCollection } from "~/modules/collections.server";
import { getAccessToken } from "~/modules/users.server";

/* Submit a new collection to the server. */
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // Get and validate the inputs from the form.
  const title = formData.get("title")?.toString();
  if (!title) {
    return "error";
  }

  const uris = formData.getAll("uri");

  const collectionInput: CollectionInput = {
    title: title,
    assignmentType: AssignmentType.Direct,
    mediaType: MediaType.Image,
    nftsAreTransferable: true,
    casts: uris.map(uri => ({
      data: {
        uri: uri.toString(),
        mimeType: "image/png",
      },
    })),
  };

  const accessToken = await getAccessToken(request);

  const collection = await createCollection({accessToken: accessToken!, input: collectionInput});
  console.log(collection);

  return redirect(`/collections/${collection.id}`);
};

export default function NewComponentLayout() {
  // TODO: consider useMatches to reduce refetching for this nested layout.
  // console.log("match", useMatches());

  // Track the number of Casts we are creating for this Collection.
  const [castCount, setCastCount] = useState(1);

  return (
    <div>
      <h1>Create a new collection</h1>

      { /* New collection form. */ }
      <Form method="post">
        <label>Collection name
          <input name="title" type="text" />
        </label>

        { /* Input the casts to create. */ }
        <ol>
          {[...(new Array(castCount))].map((val, i) =>
            <li key={i}>
              NFT:<br />
              <label>
                URI
                <input name="uri" type="text" />
              </label>
              <br />
            </li>
          )}
        </ol>
        <button onClick={() => setCastCount(castCount + 1)}>Add NFT</button>
        <br /><br />
        <button>Done!</button>
      </Form>
    </div>
  );
}
