/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
import { KgAddress } from "./types.ts";

export const getRegionForState = (state: string): string | undefined => {
  switch (state) {
    case "VT":
    case "ME":
    case "RI":
    case "CT":
    case "NH":
    case "MA":
      return "Northeast";

    case "NY":
    case "NJ":
    case "PA":
      return "Mid-Atlantic";

    case "MI":
    case "ND":
    case "SD":
    case "IA":
    case "MN":
    case "KS":
    case "NE":
    case "OH":
    case "IN":
    case "IL":
    case "WI":
    case "MO":
      return "Midwest";

    case "VA":
    case "WV":
    case "KT":
    case "DE":
    case "MD":
    case "NC":
    case "SC":
    case "TN":
    case "AR":
    case "LA":
    case "FL":
    case "GA":
    case "AL":
    case "MS":
    case "DC":
      return "Southeast";

    case "TX":
    case "AZ":
    case "NM":
    case "OK":
      return "Southwest";

    case "MT":
    case "ID":
    case "CO":
    case "UT":
    case "WY":
    case "NV":
      return "Mountain West";

    case "CA":
    case "OR":
    case "WA":
    case "HI":
    case "AK":
      return "West";

    default:
      return;
  }
};

export const formatGoogleImageUrls = (
  googleApiKey: string,
  photoReferences: string[]
): string[] =>
  photoReferences.map(
    (photoRef) =>
      `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoRef}&sensor=false&maxheight=675&maxwidth=1200&key=${googleApiKey}`
  );

// deep compare two objects and return true if they are equal
export function deepCompare(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true;
  }
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }
  const keysA = Object.keys(obj1);
  const keysB = Object.keys(obj2);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) {
      return false;
    }
    if (!deepCompare(obj1[keysA[i]], obj2[keysA[i]])) {
      return false;
    }
  }
  return true;
}
