/* eslint-disable no-console */
/*
Improvements to make:
- weird characters in artist names (Kanye West/Ye, RUFUS DU SOL)
- removal of past events
- grouping of spotify genres
- add edit entity option for changed entities. This will be key for updating the venue photos
- seperate more of the logic into smaller functions
- write tests
- authentication with new OAuth for Data Connectors
*/

import {
  createKgEntity,
  checkIfArtistEntityExists,
  fetchEventsByPerformerById,
  searchPerformersFromSeatGeek,
  fetchPerformerFromSeatGeek,
  searchForPlace,
  checkIfLocationEntityExists,
  fetchEventById,
} from './api.ts';
import {
  fetchMyTopArtistsFromSpotify,
  fetchArtistFromSpotify,
  getAccessToken,
} from './spotify_api.ts';
import { KgLocation, SeatGeekEvent, SeatGeekPerformer, SpotifyArtist, State } from './types.ts';
import { formatGoogleImageUrls, getRegionForState } from './utils.ts';

const findEventsForFavoriteArtists = async (stateString: string): Promise<string> => {
  let spotifyAccessToken = 'access token';
  let state: State;

  const inputJson = JSON.parse(stateString);

  // Initiate state the first time the function is called
  if (!inputJson.pageToken) {
    console.log('No page token found. Initiating state');
    state = {
      seatGeekPerformerIds: [],
      seatGeekEventIds: [],
    };

    const [favoriteSpotifyArtists, newToken] = await fetchMyTopArtistsWithRetry(spotifyAccessToken);

    if (newToken) {
      spotifyAccessToken = newToken;
    }

    // Find which of my personal top 50 artists have events listed on SeatGeek. Artists that don't have upcoming events aren't returned by the SeatGeek API.
    const seatGeekPerformerPromises = await Promise.allSettled(
      favoriteSpotifyArtists.map((artist) => fetchSeatGeekPerformerForSpotifyArtist(artist))
    );

    seatGeekPerformerPromises.forEach((promise) => {
      if (promise.status === 'fulfilled') {
        const artist = promise.value;
        if (artist.seatGeekPerformer) {
          state.seatGeekPerformerIds.push(promise.value.seatGeekPerformer.id.toString());
        }
      }
    });

    // Fetch all of the events that my top 50 artists are performing at
    const eventPromises = await Promise.allSettled(
      state.seatGeekPerformerIds.map((performerId) => fetchEventsByPerformerById(performerId))
    );

    const listedEvents: SeatGeekEvent[] = [];
    const uniqueMusicFestivalNames: string[] = [];

    eventPromises.forEach((promise) => {
      if (promise.status === 'fulfilled') {
        const seatGeekEventsResp = promise.value;

        //filter out duplicate festivals and use performer name
        seatGeekEventsResp.events.forEach((event) => {
          if (!uniqueMusicFestivalNames.includes(event.performers[0]?.name)) {
            if (event.type === 'music_festival') {
              event.title = event.performers[0].name;
              uniqueMusicFestivalNames.push(event.performers[0].name);
              event.performers.shift();
            }
            listedEvents.push(event);
          }
        });
      }
    });

    // remove duplicate events
    state.seatGeekEventIds = Array.from(new Set(listedEvents.map((event) => event.id.toString())));

    // Gather the other artists performing at the events (openers, music festivals).
    listedEvents
      .flatMap((listedEvent) => listedEvent.performers)
      .map((performer) => performer.id)
      .forEach((performerId) => state.seatGeekPerformerIds.push(performerId.toString()));

    // Remove duplicate artists
    state.seatGeekPerformerIds = Array.from(new Set(state.seatGeekPerformerIds));
  } else {
    // Parse the page token string after the first run
    state = JSON.parse(inputJson.pageToken);
  }

  const eventId = state.seatGeekEventIds.shift();

  if (eventId) {
    const event = await fetchEventById(eventId);

    // create Venue Location entity if it does not exist already
    let eventVenue: KgLocation = {
      meta: {
        id: event.venue.id + '_venue',
      },
      name: event.venue.name,
      address: {
        line1: event.venue.address,
        city: event.venue.city,
        region: event.venue.state,
        postalCode: event.venue.postal_code,
      },
      c_usRegion: getRegionForState(event.venue.state),
    };

    eventVenue = await getLocationPhotoGallery(eventVenue);

    const locationId = await createVenueifRequired(eventVenue);

    // create any event artists that don't exist already
    const eventPerformerIds = event.performers.map((performer) => performer.id.toString());
    const validEventPerformerIds = state.seatGeekPerformerIds.filter((id) =>
      eventPerformerIds.includes(id)
    );

    const eventArtistIds: string[] = [];

    const artistIdPromises = await Promise.allSettled(
      validEventPerformerIds.map((id) => createArtistIfRequired(spotifyAccessToken, id))
    );

    // only link artists to event that exist in kg
    artistIdPromises.forEach((promise) => {
      if (promise.status === 'fulfilled') {
        eventArtistIds.push(promise.value);
      }
    });

    const data = {
      id: event.id,
      name: event.title,
      linkedLocationId: locationId,
      startDateTime: event.datetime_local,
      endDateTime: event.datetime_local,
      linkedArtistIds: eventArtistIds,
      lowestTicketPrice: event.stats?.lowest_price?.toString(),
      averageTicketPrice: event.stats?.average_price?.toString(),
      highestTicketPrice: event.stats?.highest_price?.toString(),
      ticketUrl: event.url,
    };

    return JSON.stringify({
      data,
      nextPageToken: JSON.stringify(state),
    });
  } else {
    return JSON.stringify({ data: {} });
  }
};

export const fetchSeatGeekPerformerForSpotifyArtist = async (
  spotifyArtist: SpotifyArtist
): Promise<{ spotifyArtist: SpotifyArtist; seatGeekPerformer: SeatGeekPerformer }> => {
  const seatGeekResponse = await searchPerformersFromSeatGeek(spotifyArtist.name);

  const seatGeekPerformer = seatGeekResponse.performers.find(
    (performer) =>
      performer.type === 'band' &&
      performer.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace('\t', '')
        .toLowerCase() ===
        spotifyArtist.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace('\t', '')
          .toLowerCase()
  );

  if (seatGeekPerformer) {
    return { spotifyArtist, seatGeekPerformer };
  } else {
    // eslint-disable-next-line no-console
    console.error(`Artist ${spotifyArtist.name} does not exist in Seat Geek database`);
    throw new Error();
  }
};

export const createArtistIfRequired = async (
  spotifyAccessToken: string,
  seatGeekPerformerId: string
): Promise<string> => {
  const artistEntity = await checkIfArtistEntityExists(seatGeekPerformerId.toString());

  // if artist entity does not exist, create the entity
  if (!artistEntity) {
    const seatGeekPerformer = await fetchPerformerFromSeatGeek(seatGeekPerformerId);
    const spotifyArtistId = seatGeekPerformer.links
      ?.find((link) => link.provider === 'spotify')
      ?.id.split(':')[2];

    let spotifyArtist: SpotifyArtist | undefined;
    if (spotifyArtistId) {
      const fetchArtistResp = await fetchArtistWithRetry(spotifyAccessToken, spotifyArtistId);
      spotifyArtist = fetchArtistResp[0];
    }
    const requestBody = {
      meta: {
        id: seatGeekPerformerId.toString(),
      },
      name: spotifyArtist?.name || seatGeekPerformer.name,
      c_genres: spotifyArtist?.genres,
      c_spotifyId: spotifyArtist?.id,
      primaryPhoto: spotifyArtist?.images?.[0] && {
        image: { url: spotifyArtist.images[0].url },
      },
    };

    console.log(`Creating Artist: ${requestBody.name}`);
    return await createKgEntity('ce_artist', requestBody);
  } else {
    console.log(`Artist already exists: ${artistEntity.meta.id}`);
    return artistEntity.meta.id;
  }
};

const createVenueifRequired = async (location: KgLocation): Promise<string> => {
  const venue = await checkIfLocationEntityExists(location.meta.id);

  if (!venue) {
    console.log(`Creating location: ${location.name}`);
    return await createKgEntity('location', location);
  }

  console.log(`Location ${location.name} already exists`);
  return location.meta.id;
};

const fetchArtistWithRetry = async (
  spotifyAccessToken: string,
  spotifyArtistId: string
): Promise<[SpotifyArtist, string]> => {
  try {
    const artist = await fetchArtistFromSpotify(spotifyAccessToken, spotifyArtistId);
    return [artist, ''];
  } catch (_error) {
    console.log('fetching new token');
    spotifyAccessToken = await getAccessToken();
  }

  const artist = await fetchArtistFromSpotify(spotifyAccessToken, spotifyArtistId);

  return [artist, spotifyAccessToken];
};

const fetchMyTopArtistsWithRetry = async (
  spotifyAccessToken: string
): Promise<[SpotifyArtist[], string]> => {
  try {
    const artistsResp = await fetchMyTopArtistsFromSpotify(spotifyAccessToken);
    return [artistsResp.items, ''];
  } catch (_error) {
    console.log('fetching new token');
    spotifyAccessToken = await getAccessToken();
  }

  const artistsResp = await fetchMyTopArtistsFromSpotify(spotifyAccessToken);

  return [artistsResp.items, spotifyAccessToken];
};

// TODO: error handling
export const getLocationPhotoGallery = async (venue: KgLocation): Promise<KgLocation> => {
  const googlePlaceResults = await searchForPlace(venue.name);

  if (
    googlePlaceResults.results.length > 0 &&
    googlePlaceResults.results[0].name.toLowerCase() === venue.name
  ) {
    const googlePhotoUrls = formatGoogleImageUrls(
      'AIzaSyAqtI0LYwB9Wo0GXiZU4cH8cVpFFi3u8Ko',
      googlePlaceResults.results[0].photos.map((photo) => photo.photo_reference)
    );

    return { ...venue, photoGallery: googlePhotoUrls.map((url) => ({ image: { url } })) };
  } else {
    return venue;
  }
};

export default findEventsForFavoriteArtists;
