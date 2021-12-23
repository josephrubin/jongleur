import { useLoaderData } from "remix"

export default function () {
  const data: LoaderData = useLoaderData();

  return (
    <div>
      <h2>Click on a collection to see it.</h2>
    </div>
  )
}