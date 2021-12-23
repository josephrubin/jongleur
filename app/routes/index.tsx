import type { MetaFunction, LoaderFunction } from "remix";
import { useLoaderData, json, Link } from "remix";

type IndexData = {
  resources: Array<{ name: string; url: string }>;
  demos: Array<{ name: string; to: string }>;
};

// https://remix.run/api/conventions#meta
export const meta: MetaFunction = () => {
  return {
    title: "Remix Starter",
    description: "Welcome to remix!",
  };
};

// https://remix.run/guides/routing#index-routes
export default function Index() {
  const data = useLoaderData<IndexData>();

  return (
    <div className="remix__page">
      <main>
        <h2>Welcome to RoJo App!</h2>
        <p>It's gonna be a good time 🥳</p>
        <p>
          This app makes it easy for communities to create NFT collections and
          award them to users.
        </p>
      </main>
    </div>
  );
}
