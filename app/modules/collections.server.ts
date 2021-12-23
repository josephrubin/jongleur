import { gql } from "graphql-request";
import { Collection, MutationCreateCollectionArgs } from "~/generated/graphql-schema";
import * as graphql from "./graphql.server";

export async function readCollections(accessToken: string) {
  const query = gql`
      query ReadCollections($accessToken: String!) {
        readAuthenticate(accessToken: $accessToken) {
          collections {
            id
            title
          }
        }
      }
  `;

  const data = await graphql.request(query, {
    accessToken: accessToken,
  });
  return data.readAuthenticate.collections;
}

export async function readCollection(id: string) : Promise<Collection> {
  const query = gql`
    query ReadCollection($id: ID!) {
      collection: readCollection(id: $id) {
        id
        title
        casts {
          id
          data {
            uri
            mimeType
          }
        }
      }
    }
  `;

  const response = await graphql.request(query, {
    id: id,
  });

  return response.collection;
}

export async function createCollection(args: MutationCreateCollectionArgs) : Promise<Collection> {
  const mutation = gql`
    mutation CreateCollection($accessToken: String!, $input: CollectionInput!) {
      createCollection(accessToken: $accessToken, input: $input) {
        id
        title
      }
    }
  `;

  const response = await graphql.request(mutation, {
    accessToken: args.accessToken,
    input: args.input,
  });

  return response.createCollection;
}
