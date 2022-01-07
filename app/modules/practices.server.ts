import { gql } from "graphql-request";
import { AuthenticatedUserPracticeArgs, Practice, QueryReadAuthenticateArgs } from "~/generated/graphql-schema";
import * as graphql from "~/modules/graphql.server";

export async function readMyPractice(authArgs: QueryReadAuthenticateArgs, practiceArgs: AuthenticatedUserPracticeArgs): Promise<Practice[]> {
  const request = gql`
    query ReadMyPractice($accessToken: String!, $id: ID!) {
      readAuthenticate(accessToken: $accessToken) {
        practice(id: $id) {
          id
          durationSeconds
          tempoBpm
          renderableWaveform
          renderableWaveformSamplesPerSecond
          uploadEpoch
          audioUrl
          segments {
            renderableSampleFirst
            renderableSampleLast
            durationSeconds
            audioUrl
          }
        }
      }
    }
  `;

  const response = await graphql.request(request, {
    accessToken: authArgs.accessToken,
    id: practiceArgs.id,
  });

  return response.readAuthenticate.practice;
}

export async function readMyPractices(args: QueryReadAuthenticateArgs): Promise<Practice[]> {
  const request = gql`
    query ReadMyPractices($accessToken: String!) {
      readAuthenticate(accessToken: $accessToken) {
        practices {
          id
          durationSeconds
          uploadEpoch
          segments {
            durationSeconds
          }
          piece {
            id
            kIndex
            key
          }
        }
      }
    }
  `;

  const response = await graphql.request(request, {
    accessToken: args.accessToken,
  });

  return response.readAuthenticate.practices;
}
