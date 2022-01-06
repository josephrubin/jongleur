import { gql } from "graphql-request";
import { Piece, QueryReadPieceArgs } from "~/generated/graphql-schema";
import * as graphql from "./graphql.server";

export async function readPieces(): Promise<Piece[]> {
  const request = gql`{
    pieces: readPieces {
      id
      kIndex
      key
    }
  }`;

  const response = await graphql.request(request);

  return response.pieces;
}

export async function readPiece(args: QueryReadPieceArgs): Promise<Piece> {
  const request = gql`
    query ReadPieces($id: ID!) {
      piece: readPiece(id: $id) {
        id
        kIndex
        key
      }
    }
  `;

  const response = await graphql.request(request, {
    id: args.id,
  });

  return response.piece;
}
