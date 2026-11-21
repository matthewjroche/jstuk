import { describe, expect, it } from "vitest";
import { buildJobPreferenceFilter, type JobPreferenceProfile } from "@/lib/jobs/preference-fit";
import { normalizePreferredLocations } from "@/lib/profile/locations";

/**
 * A UK candidate in a small town, the case the US-built matcher was failing.
 * The preferred location is exactly what the location picker now saves.
 */
const HEBDEN_BRIDGE: JobPreferenceProfile = {
  location: "Hebden Bridge",
  preferredLocations: ["Hebden Bridge, West Yorkshire, United Kingdom"],
  remoteLocations: ["United Kingdom"],
  remotePreference: "all",
  workPreferences: [],
  workModes: ["remote", "hybrid", "onsite"],
  constraints: [],
  dealBreakers: [],
};

const accepts = (location: string, profile = HEBDEN_BRIDGE) =>
  buildJobPreferenceFilter(profile)({ title: "Data Analyst", location }).accepted;

describe("UK on-site and hybrid locations", () => {
  it("accepts the town however the board writes it", () => {
    expect(accepts("Hebden Bridge")).toBe(true);
    expect(accepts("Hebden Bridge, West Yorkshire")).toBe(true);
    expect(accepts("Hebden Bridge, West Yorkshire, England, United Kingdom")).toBe(true);
    expect(accepts("Hebden Bridge, UK")).toBe(true);
  });

  it("accepts other towns in the same county", () => {
    expect(accepts("Halifax, West Yorkshire")).toBe(true);
    expect(accepts("Leeds, West Yorkshire, England")).toBe(true);
  });

  it("rejects a different county, and does not treat England as the whole target", () => {
    expect(accepts("Manchester, Greater Manchester")).toBe(false);
    expect(accepts("Bristol, England")).toBe(false);
    expect(accepts("London, England, United Kingdom")).toBe(false);
  });

  it("treats a bare 'United Kingdom' posting as country-wide", () => {
    expect(accepts("United Kingdom")).toBe(true);
    expect(accepts("UK")).toBe(true);
  });

  it("rejects an on-site role in another country", () => {
    expect(accepts("Austin, Texas, United States")).toBe(false);
    expect(accepts("Berlin, Germany")).toBe(false);
  });

  it("accepts hybrid roles in the town", () => {
    expect(accepts("Hybrid - Hebden Bridge, West Yorkshire")).toBe(true);
    expect(accepts("Hybrid - Bristol")).toBe(false);
  });
});

describe("UK remote roles", () => {
  it("accepts remote with no region and UK-restricted remote", () => {
    expect(accepts("Remote")).toBe(true);
    expect(accepts("Remote - United Kingdom")).toBe(true);
    expect(accepts("Remote, UK")).toBe(true);
    expect(accepts("United Kingdom (Remote)")).toBe(true);
  });

  it("rejects remote roles restricted to another country", () => {
    expect(accepts("Remote - United States")).toBe(false);
    expect(accepts("Remote, Canada")).toBe(false);
  });

  it("accepts a Europe-wide remote role for a UK worker", () => {
    expect(accepts("Remote - Europe")).toBe(true);
  });
});

describe("a county-less UK label", () => {
  it("still matches the town and the nation", () => {
    const edinburgh: JobPreferenceProfile = {
      ...HEBDEN_BRIDGE,
      location: "Edinburgh",
      preferredLocations: ["Edinburgh, Scotland, United Kingdom"],
    };
    expect(accepts("Edinburgh", edinburgh)).toBe(true);
    expect(accepts("Glasgow, Scotland", edinburgh)).toBe(true);
    expect(accepts("Cardiff, Wales", edinburgh)).toBe(false);
  });
});

describe("normalizePreferredLocations — UK entries", () => {
  it("re-joins a split UK address and leaves a whole one alone", () => {
    expect(normalizePreferredLocations(["Harrogate", "North Yorkshire", "United Kingdom"])).toEqual([
      "Harrogate, North Yorkshire, United Kingdom",
    ]);
    expect(normalizePreferredLocations(["Harrogate, North Yorkshire, United Kingdom"])).toEqual([
      "Harrogate, North Yorkshire, United Kingdom",
    ]);
    expect(normalizePreferredLocations(["Leeds", "Scotland"])).toEqual(["Leeds, Scotland"]);
  });
});
