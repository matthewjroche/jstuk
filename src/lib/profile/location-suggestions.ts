/**
 * Turning OpenStreetMap (Nominatim) search results into the location labels the
 * picker saves — "Hebden Bridge, West Yorkshire, United Kingdom".
 *
 * Lives outside the API route so the choices below can be tested against real
 * responses. They matter: a saved label is later matched, word for word, against
 * the location text a job board prints, so a label that names the wrong place
 * (or none) silently hides every posting for that area.
 */

export type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  municipality?: string;
  state_district?: string;
  county?: string;
  region?: string;
  state?: string;
  country?: string;
  country_code?: string;
};

export type NominatimResult = {
  address?: NominatimAddress;
  /** What kind of thing the match is ("town", "road", "shop"…). Present in `jsonv2`. */
  addresstype?: string;
  display_name?: string;
  osm_id?: number;
  place_id?: number;
};

/**
 * The kinds of match worth offering. Without this the list fills with streets and
 * businesses that merely share a name — "Harrogate Road" — and a small town is
 * pushed out of the handful of suggestions that are shown.
 */
const PLACE_ADDRESS_TYPES = new Set([
  "city",
  "town",
  "village",
  "hamlet",
  "suburb",
  "city_district",
  "borough",
  "municipality",
  "county",
  "state_district",
  "region",
  "state",
  "province",
  "country",
]);

export function isPlaceResult(result: NominatimResult): boolean {
  // An older Nominatim, or a response without the field, is not a reason to
  // offer nothing — fall back to showing whatever it matched.
  if (!result.addresstype) return true;
  return PLACE_ADDRESS_TYPES.has(result.addresstype);
}

/**
 * Best-effort bounding box for the UK and Ireland, as Nominatim's
 * `left,top,right,bottom`. Sent with `bounded=0`, so it only ranks matches in the
 * box first — typing "Richmond" offers the Yorkshire one before Virginia — and
 * never hides a place elsewhere.
 */
export const UK_IRELAND_VIEWBOX = "-10.8,60.9,2.0,49.8";

export function formatLocation(result: NominatimResult): string | null {
  const address = result.address;
  if (!address) return null;

  // Smallest named place first. `city` is not the town: for Hebden Bridge the
  // response carries `city: "Calderdale"` (the borough) beside
  // `town: "Hebden Bridge"`, and taking `city` first offered the borough and
  // never the town the user typed.
  const place =
    address.town ??
    address.village ??
    address.hamlet ??
    address.city ??
    address.municipality ??
    address.suburb;

  const isUk = address.country_code?.toLowerCase() === "gb";
  // UK postings name the county ("Harrogate, North Yorkshire"), whereas `state`
  // is only ever England, Scotland, Wales or Northern Ireland. Saving "England"
  // made the label match every English posting while missing the county the
  // board actually printed.
  const region = isUk
    ? address.county ?? address.state_district ?? address.state
    : address.state ?? address.state_district ?? address.county ?? address.region;
  const country = address.country;

  if (place) return joinParts([place, region, country]);
  if (region && country) return joinParts([region, country]);
  if (country) return country;

  return null;
}

function joinParts(values: Array<string | undefined>): string {
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(trimmed);
  }

  return parts.join(", ");
}

/** Place-like matches as unique labels, best first. */
export function suggestionLabels(results: NominatimResult[], max = 6): string[] {
  const labels = results
    .filter(isPlaceResult)
    .map(formatLocation)
    .filter((value): value is string => Boolean(value));
  return [...new Set(labels)].slice(0, max);
}
