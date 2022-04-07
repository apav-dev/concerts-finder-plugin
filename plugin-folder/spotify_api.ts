import axiod from "https://deno.land/x/axiod/mod.ts";
import * as queryString from "https://deno.land/x/querystring@v1.0.2/mod.js";
import { SpotifyArtist, SpotifyArtists } from "./types.ts";

declare const SPOTIFY_REFRESH_TOKEN: string;
declare const SPOTIFY_AUTH: string;
// ############################################ Spotify APIs ############################################

export const getAccessToken = async (): Promise<string> => {
  console.log(SPOTIFY_REFRESH_TOKEN);
  const res = await axiod.post(
    "https://accounts.spotify.com/api/token",
    queryString.stringify({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
    {
      headers: {
        Authorization: `Basic ${SPOTIFY_AUTH}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return res.data.access_token;
};

export const fetchMyTopArtistsFromSpotify = async (
  accessToken: string
): Promise<SpotifyArtists> => {
  const res = await axiod.get(
    "https://api.spotify.com/v1/me/top/artists?limit=50",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return res.data;
};

export const fetchArtistFromSpotify = async (
  accessToken: string,
  artistId: string
): Promise<SpotifyArtist> => {
  const res = await axiod.get(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return res.data;
};
