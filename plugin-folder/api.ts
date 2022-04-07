import axiod from "https://deno.land/x/axiod@0.23.2/mod.ts";
import {
  KgArtist,
  KgLocation,
  SeatGeekEventResponse,
  SeatGeekPerfomers,
  SeatGeekPerformer,
  GooglePlaceResults,
  SeatGeekEvent,
} from "./types.ts";

declare const SEAT_GEEK_CLIENT_ID: string;
declare const SEAT_GEEK_CLIENT_SECRET: string;

// ############################################ SeatGeek APIs ############################################
export const searchPerformersFromSeatGeek = async (
  q: string
): Promise<SeatGeekPerfomers> => {
  const res = await axiod.get("https://api.seatgeek.com/2/performers", {
    params: {
      q,
      client_id: SEAT_GEEK_CLIENT_ID,
      client_secret: SEAT_GEEK_CLIENT_SECRET,
    },
  });

  return res.data;
};

export const fetchPerformerFromSeatGeek = async (
  artistId: string
): Promise<SeatGeekPerformer> => {
  const res = await axiod.get(
    `https://api.seatgeek.com/2/performers/${artistId}`,
    {
      params: {
        client_id: SEAT_GEEK_CLIENT_ID,
        client_secret: SEAT_GEEK_CLIENT_SECRET,
      },
    }
  );

  return res.data;
};

export const fetchEventsByPerformerById = async (
  perfomerId: string
): Promise<SeatGeekEventResponse> => {
  const res = await axiod.get("https://api.seatgeek.com/2/events", {
    params: {
      "performers.id": perfomerId,
      "venue.country": "US",
      // using max page to get all events for a performer at once
      per_page: 5000,
      client_id: SEAT_GEEK_CLIENT_ID,
      client_secret: SEAT_GEEK_CLIENT_SECRET,
    },
  });

  return res.data;
};

export const fetchEventById = async (id: string): Promise<SeatGeekEvent> => {
  const res = await axiod.get(`https://api.seatgeek.com/2/events/${id}`, {
    params: {
      client_id: SEAT_GEEK_CLIENT_ID,
      client_secret: SEAT_GEEK_CLIENT_SECRET,
    },
  });

  return res.data;
};

// ############################################ Knowledge Graph APIs ############################################

export const checkIfArtistEntityExists = async (
  entityId: string
): Promise<KgArtist> => (await checkIfKgEntityExists(entityId)) as KgArtist;

export const checkIfLocationEntityExists = async (
  entityId: string
): Promise<KgLocation> => (await checkIfKgEntityExists(entityId)) as KgLocation;

const checkIfKgEntityExists = async (
  entityId: string
): Promise<KgArtist | KgLocation | undefined> => {
  try {
    const res = await axiod.get(
      `https://api-sandbox.yext.com/v2/accounts/3148902/entities/${entityId}`,
      {
        params: {
          api_key: "e00402a95669090a8ccb240cc785e7b8",
          v: "20220322",
        },
      }
    );

    return res.data.response;
  } catch (error) {
    if (error.response) {
      console.error(`${error.response.status}: ${error.response.data}`);

      if (error.response.status === 404) {
        return;
      }
    }
    throw error;
  }
};

export const createKgEntity = async (
  entityType: string,
  data: KgLocation | KgArtist
): Promise<string> => {
  try {
    const res = await axiod.post(
      "https://api-sandbox.yext.com/v2/accounts/3148902/entities",
      data,
      {
        params: {
          api_key: "deb41344dd6799c43ecd13c5f88a502f",
          v: "20220322",
          entityType,
        },
      }
    );

    return res.data.response.meta.id;
  } catch (error) {
    if (error.response) {
      console.error(`${error.response.status}: ${error.response.data}`);
    }
    throw error;
  }
};

export const editKgEntity = async (
  entityId: string,
  data: KgArtist | KgLocation
): Promise<string> => {
  try {
    const res = await axiod.put(
      `https://api-sandbox.yext.com/v2/accounts/3148902/entities/${entityId}`,
      data,
      {
        params: {
          api_key: "deb41344dd6799c43ecd13c5f88a502f",
          v: "20220322",
        },
      }
    );

    return res.data.response.meta.id;
  } catch (error) {
    if (error.response) {
      console.error(`${error.response.status}: ${error.response.data}`);
    }
    throw error;
  }
};

// ###################################### Google APIs #################################
// https://maps.googleapis.com/maps/api/place/textsearch/json?query=barclays center&key=AIzaSyAqtI0LYwB9Wo0GXiZU4cH8cVpFFi3u8Ko

export const searchForPlace = async (
  query: string
): Promise<GooglePlaceResults> => {
  try {
    const res = await axiod.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          key: "AIzaSyAqtI0LYwB9Wo0GXiZU4cH8cVpFFi3u8Ko",
          query,
        },
      }
    );

    return res.data;
  } catch (error) {
    if (error.response) {
      console.error(`${error.response.status}: ${error.response.data}`);
    }
    throw error;
  }
};
