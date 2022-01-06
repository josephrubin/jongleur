import { useMatches } from "remix";

/**
 * Assuming you have called `getAccessToken` in the root route,
 * this custom hook will retrieve the token on the client side!
 */
export function useAccessToken(): string | null {
  // Get all loader data from parent routes.
  const matches = useMatches();
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    // Look for the access token at the root route.
    if (match.pathname === "/" && Object.keys(match.data).includes("accessToken")) {
      return match.data.accessToken;
    }
  }
  return null;
}
