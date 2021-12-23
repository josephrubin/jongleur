import { useLoaderData, Outlet, Link } from "remix";
import { readCollections } from "~/modules/collections.server";
import { Collection } from "~/generated/graphql-schema";
import { getAccessToken } from "~/modules/users.server";

interface LoaderData {
  readonly collections: Collection[];
}

export async function loader({request}) {
  const accessToken = await getAccessToken(request);

  return {collections: await readCollections(accessToken!)};
}

export default function CollectionsLayout() {
  const data: LoaderData = useLoaderData();

  const sortedCollections = data.collections.sort(
    (a, b) => a.title.localeCompare(b.title)
  );

  return (
    <div>
      <h1>Here Are Your Collections</h1>
      <Link to={"./"}>
        Index
      </Link>
      <br />
      <Link to={"new"}>
        Create a new collection
      </Link>
      { /* List of collections. */ }
      <ol>
        {sortedCollections.map(collection =>
          <li key={collection.id}>
            <Link to={String(collection.id)}>{collection.title}</Link>
          </li>
        )}
      </ol>
      <Outlet />
    </div>
  );
}
