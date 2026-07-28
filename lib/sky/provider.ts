import { ALULA } from "@/data/sites";
import { mockSkyProvider } from "@/lib/sky/mock";
import type { Coords, SkyProvider, SkyReading } from "@/lib/sky/types";

/* The seam.
 *
 * Every sky view calls getSky and nothing else. Swapping the mock for real
 * feeds is a change to this one binding: build a provider that satisfies
 * SkyProvider and assign it below.
 *
 * A real implementation is likely to be three providers behind one facade —
 * astronomy-engine for ephemerides, OpenWeather for cloud and seeing, Light
 * Pollution Map for SQM — composed into a single reading here, with each
 * field's provenance set to "computed" as it stops being modelled.
 */

const provider: SkyProvider = mockSkyProvider;

export function skyProviderName(): string {
  return provider.name;
}

/**
 * The sky over a place on a night.
 *
 * Defaults to AlUla town, which is the reference point the sites are measured
 * from. Pass a site's own coordinates for a site-specific reading.
 */
export function getSky(date: Date, coords: Coords = ALULA): Promise<SkyReading> {
  return provider.get(date, coords);
}

export type { SkyReading, Coords };
