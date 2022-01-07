import { gql } from "graphql-request";
import { Piece, QueryReadPieceArgs } from "~/generated/graphql-schema";
import * as graphql from "./graphql.server";
import * as fs from "fs";

// The only thing we cache in Jongleur is the list of Pieces, because loading
// all of them takes a long time.
// This is a very simple tmpfile cache which is never purged and a better
// caching middleware will have to wait until later.
const piecesCacheFile = "/tmp/pieces-cache.json";
export async function readPieces(): Promise<Piece[]> {
  try {
    const stat = fs.statSync(piecesCacheFile);
    if (!stat.isFile()) {
      throw "Not there.";
    }
  }
  catch (err) {
    // Cache miss, request the data.
    const request = gql`{
      pieces: readPieces {
        id
        kIndex
        key
      }
    }`;

    const response = await graphql.request(request);
    const pieces = response.pieces;

    fs.writeFileSync(piecesCacheFile, JSON.stringify(pieces));

    return pieces;
  }

  // Found Pieces in the cache.
  const pieces = JSON.parse(fs.readFileSync(piecesCacheFile, "utf-8"));
  return pieces;
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
