// deno-lint-ignore-file camelcase
export interface State {
  seatGeekPerformerIds: string[];
  seatGeekEventIds: string[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
}

export interface SpotifyArtists {
  items: SpotifyArtist[];
}

export interface KgPhoto {
  image: {
    url: string;
    sourceUrl?: string;
  };
}

export interface KgArtist {
  meta: KgMeta;
  name: string;
  primaryPhoto?: KgPhoto;
  c_genres?: string[];
  c_spotifyId?: string;
}

// class is used exclusively for object comparison
export class Artist implements KgArtist {
  meta: KgMeta;
  name: string;
  primaryPhoto?: KgPhoto | undefined;
  c_genres?: string[] | undefined;
  c_spotifyId?: string | undefined;

  constructor(obj: KgArtist, imageUrl: string) {
    this.meta = { id: obj.meta.id };
    this.name = obj.name;
    if (obj.primaryPhoto) {
      this.primaryPhoto = { image: { url: imageUrl } };
    }
    this.c_genres = obj.c_genres;
    this.c_spotifyId = obj.c_spotifyId;
  }
}

export interface SeatGeekPerformer {
  id: number;
  type: string;
  name: string;
  image: string;
  genres?: { name: string }[];
  links?: {
    id: string;
    url: string;
    provider: string;
  }[];
}

export interface SeatGeekPerfomers {
  performers: SeatGeekPerformer[];
}

export interface SeatGeekVenue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  googlePhotoUrls?: string[];
}

export interface SeatGeekEvent {
  id: number;
  type: string;
  title: string;
  datetime_local: string;
  venue: SeatGeekVenue;
  performers: SeatGeekPerformer[];
  stats: {
    lowest_price: number;
    average_price: number;
    highest_price: number;
  };
  url: string;
}

export interface SeatGeekEventResponse {
  events: SeatGeekEvent[];
}

export interface KgMeta {
  id: string;
}

export interface KgResponseEntity {
  response: {
    meta: KgMeta;
  };
}

export interface KgAddress {
  line1: string;
  city: string;
  region: string;
  postalCode: string;
}

export interface KgLocation {
  meta: KgMeta;
  name: string;
  address: KgAddress;
  c_usRegion?: string;
  photoGallery?: KgPhoto[];
}

export interface KgEvent {
  id: string;
  name?: string;
  linkedLocationId?: string;
  startDateTime?: string;
  endDateTime?: string;
  linkedArtistIds?: string[];
  lowestTicketPrice?: string;
  averageTicketPrice?: string;
  highestTicketPrice?: string;
  ticketUrl?: string;
}

export interface GooglePlaceResults {
  results: {
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    photos: {
      photo_reference: string;
    }[];
  }[];
}
