import { useCatch, useLoaderData, LoaderFunction } from "remix";
import { readCollection } from "~/modules/collections.server";

export const loader: LoaderFunction = async function loader({ params }) {
  const collection = await readCollection(params.id);

  if (!collection) {
    throw new Response("Collection not found", { status: 404 });
  }

  return collection;
};

export default function IdLayout() {
  const data = useLoaderData();

  return (
    <div>
      The nested id route, with id: {data.id}, title: {data.title} of size {data.size}.
      Here are the casts:
      <ol>
        {data.casts.map(cast =>
          (<li key={cast.id}>
            {cast.id}: ({cast.data.uri}, {cast.data.mimeType})
            <br />
            <img src={cast.data.uri} />
          </li>)
        )}
      </ol>

    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div>
        <h2>Not Found</h2>
      </div>
    );
  }
}
