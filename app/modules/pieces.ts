import { Piece, Practice } from "~/generated/graphql-schema";

export function makePieceUrl(piece: Piece) {
  return `/piece/${piece.id}/`;
}

export function makeScarlattiPieceLabel(piece: Piece) {
  return `K.${piece.kIndex} in ${piece.key}`;
}

/**
 * Return a map of Piece -> Practice[] from the given Practice[] list.
 */
export function makePieceToPracticesMap(practices: Practice[]) {
  return practices.reduce((map, practice) => {
    const piecePractices = map.get(practice.piece) || [];
    piecePractices.push(practice);
    map.set(practice.piece, piecePractices);
    return map;
  }, new Map<Piece, Practice[]>());
}

/**
 * Return a list Piece[] sorted by the number of times each was practices.
 * If takeCount is not given, return the whole list.
 */
export function getMostPracticedPiecesSorted(practices: Practice[], takeCount?: number) {
  return (
    // Get a list of the map's entry pairs...
    [...makePieceToPracticesMap(practices)]
      // ...sort them by the length of their practice list...
      .sort((entryOne, entryTwo) => entryOne[1].length - entryTwo[1].length)
      // ...consider only the pieces...
      .map(entry => entry[0])
      // ...and take only `takeCount` many, if it is defined.
      .slice(0, takeCount)
  );
}
