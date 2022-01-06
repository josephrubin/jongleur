import { Practice } from "~/generated/graphql-schema";

export function makePracticeUrl(practice: Practice) {
  return `/piece/${practice.piece.id}/${practice.id}`;
}
