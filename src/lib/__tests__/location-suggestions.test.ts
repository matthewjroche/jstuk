import { describe, expect, it } from "vitest";
import {
  formatLocation,
  isPlaceResult,
  suggestionLabels,
  type NominatimResult,
} from "@/lib/profile/location-suggestions";

/** Shapes copied from live Nominatim responses (jsonv2 with addressdetails). */
const HEBDEN_BRIDGE: NominatimResult = {
  addresstype: "town",
  address: {
    city: "Calderdale",
    town: "Hebden Bridge",
    state_district: "West Yorkshire",
    state: "England",
    country: "United Kingdom",
    country_code: "gb",
  },
};

const PATELEY_BRIDGE: NominatimResult = {
  addresstype: "town",
  address: {
    town: "Pateley Bridge",
    county: "North Yorkshire",
    state_district: "York and North Yorkshire",
    state: "England",
    country: "United Kingdom",
    country_code: "gb",
  },
};

describe("formatLocation — UK places", () => {
  it("offers the town, not the borough Nominatim files under `city`", () => {
    // The regression: `city: "Calderdale"` won, so a user typing Hebden Bridge
    // was offered Calderdale and never their own town.
    expect(formatLocation(HEBDEN_BRIDGE)).toBe("Hebden Bridge, West Yorkshire, United Kingdom");
  });

  it("names the county rather than England", () => {
    // Boards print "Pateley Bridge, North Yorkshire". "England" would also match
    // every English posting, so it is the wrong thing to save.
    expect(formatLocation(PATELEY_BRIDGE)).toBe("Pateley Bridge, North Yorkshire, United Kingdom");
  });

  it("uses a hamlet or village when that is all the place is", () => {
    expect(
      formatLocation({
        address: { hamlet: "Wood Top", county: "West Yorkshire", state: "England", country: "United Kingdom", country_code: "gb" },
      }),
    ).toBe("Wood Top, West Yorkshire, United Kingdom");
  });

  it("still returns a city for a big city", () => {
    expect(
      formatLocation({
        address: { city: "Leeds", state_district: "West Yorkshire", state: "England", country: "United Kingdom", country_code: "gb" },
      }),
    ).toBe("Leeds, West Yorkshire, United Kingdom");
  });

  it("falls back to the nation when there is no county", () => {
    expect(
      formatLocation({ address: { city: "Edinburgh", state: "Scotland", country: "United Kingdom", country_code: "gb" } }),
    ).toBe("Edinburgh, Scotland, United Kingdom");
  });
});

describe("formatLocation — elsewhere", () => {
  it("keeps the state-first behaviour outside the UK", () => {
    expect(
      formatLocation({
        address: { city: "Nashville", county: "Davidson County", state: "Tennessee", country: "United States", country_code: "us" },
      }),
    ).toBe("Nashville, Tennessee, United States");
  });

  it("returns a region or country when no place is named", () => {
    expect(formatLocation({ address: { state: "Bavaria", country: "Germany", country_code: "de" } })).toBe("Bavaria, Germany");
    expect(formatLocation({ address: { country: "Canada" } })).toBe("Canada");
  });

  it("returns nothing without an address", () => {
    expect(formatLocation({})).toBeNull();
  });
});

describe("suggestionLabels", () => {
  it("drops streets and shops that merely share the name", () => {
    const labels = suggestionLabels([
      { addresstype: "road", address: { town: "Harrogate", county: "North Yorkshire", country: "United Kingdom", country_code: "gb" } },
      { addresstype: "shop", address: { town: "Harrogate", county: "North Yorkshire", country: "United Kingdom", country_code: "gb" } },
      { addresstype: "town", address: { town: "Harrogate", county: "North Yorkshire", country: "United Kingdom", country_code: "gb" } },
    ]);
    expect(labels).toEqual(["Harrogate, North Yorkshire, United Kingdom"]);
    expect(isPlaceResult({ addresstype: "road" })).toBe(false);
    expect(isPlaceResult({ addresstype: "hamlet" })).toBe(true);
  });

  it("keeps a result that reports no type rather than offering nothing", () => {
    expect(isPlaceResult({})).toBe(true);
  });

  it("de-duplicates and caps the list", () => {
    const many: NominatimResult[] = Array.from({ length: 10 }, (_, index) => ({
      addresstype: "town",
      address: { town: `Town ${index}`, county: "Somewhere", country: "United Kingdom", country_code: "gb" },
    }));
    expect(suggestionLabels([...many, ...many])).toHaveLength(6);
  });
});
