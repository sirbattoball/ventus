/**
 * HVAC Lead Scraper
 * Pulls contractor leads from Google Places API
 * Filters, scores, and formats for outreach
 */

import { scoreLeads, type RawLead, type ScoredLead } from "./scorer";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

const HVAC_KEYWORDS = [
  "HVAC contractor",
  "air conditioning repair",
  "heating and cooling",
  "HVAC service",
  "furnace repair",
];

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: { lat: number; lng: number };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

function extractCity(result: PlaceResult): string {
  const components = result.address_components ?? [];
  const cityComp = components.find(
    (c) => c.types.includes("locality") || c.types.includes("sublocality")
  );
  const stateComp = components.find((c) => c.types.includes("administrative_area_level_1"));
  const city = cityComp?.long_name ?? result.formatted_address?.split(",")[1]?.trim() ?? "Unknown";
  return city;
}

function extractState(result: PlaceResult): string {
  const components = result.address_components ?? [];
  const stateComp = components.find((c) => c.types.includes("administrative_area_level_1"));
  return stateComp?.short_name ?? "US";
}

// ─── CORE SCRAPER ─────────────────────────────────────────────────────────────
export async function fetchHVACLeads(
  location: string,         // city name or "lat,lng"
  radiusMiles: number = 25,
  maxResults: number = 40
): Promise<ScoredLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const allRaw: RawLead[] = [];
  const seenIds = new Set<string>();

  // Step 1: Geocode location string to lat/lng
  let lat: number, lng: number;
  if (/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(location)) {
    [lat, lng] = location.split(",").map(Number);
  } else {
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    );
    const geoData = await geoRes.json();
    if (geoData.status !== "OK" || !geoData.results[0]) {
      throw new Error(`Could not geocode location: ${location}`);
    }
    lat = geoData.results[0].geometry.location.lat;
    lng = geoData.results[0].geometry.location.lng;
  }

  // Step 2: Text search for each HVAC keyword
  for (const keyword of HVAC_KEYWORDS.slice(0, 2)) { // limit API calls
    let pageToken: string | null = null;
    let pagesFetched = 0;

    do {
      const url = pageToken
        ? `${PLACES_BASE}/nearbysearch/json?pagetoken=${pageToken}&key=${apiKey}`
        : `${PLACES_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(keyword)}&type=establishment&key=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error(`Places API error: ${data.status}`, data.error_message);
        break;
      }

      for (const place of (data.results ?? []) as PlaceResult[]) {
        if (seenIds.has(place.place_id)) continue;
        seenIds.add(place.place_id);

        // Fetch full details for phone + website
        let details: PlaceResult = place;
        try {
          const detailRes = await fetch(
            `${PLACES_BASE}/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,address_components,types&key=${apiKey}`
          );
          const detailData = await detailRes.json();
          if (detailData.status === "OK") {
            details = { ...place, ...detailData.result };
          }
        } catch {}

        allRaw.push({
          name: details.name,
          phone: details.formatted_phone_number,
          website: details.website,
          address: details.formatted_address,
          city: extractCity(details),
          state: extractState(details),
          rating: details.rating,
          reviewCount: details.user_ratings_total ?? 0,
          placeId: details.place_id,
          types: details.types,
        });

        if (allRaw.length >= maxResults) break;
      }

      pageToken = data.next_page_token ?? null;
      pagesFetched++;

      // Google requires a short delay before using next_page_token
      if (pageToken) await new Promise(r => setTimeout(r, 2000));
    } while (pageToken && pagesFetched < 3 && allRaw.length < maxResults);

    if (allRaw.length >= maxResults) break;
  }

  // Step 3: Score and filter
  return scoreLeads(allRaw);
}

// ─── MOCK SCRAPER (no API key) ────────────────────────────────────────────────
// Used in development / demo mode when GOOGLE_PLACES_API_KEY is not set
const MOCK_CITIES = [
  "Atlanta", "Charlotte", "Nashville", "Dallas", "Phoenix",
  "Tampa", "Orlando", "Denver", "Houston", "Raleigh",
];

const MOCK_BUSINESS_NAMES = [
  "Elite Climate Solutions", "Southern Comfort HVAC", "Metro Air Systems",
  "Premier Heating & Cooling", "Patriot HVAC Services", "TrueTemp HVAC",
  "Alpine Air Conditioning", "Sunbelt HVAC", "Guardian Climate Control",
  "Peak Performance HVAC", "Blue Ribbon Heating", "Liberty Air Services",
  "Diamond HVAC Group", "Reliable Comfort Systems", "Pro-Tech Climate",
  "All Seasons HVAC", "Precision Air Group", "American Air Services",
  "PowerCool HVAC", "Cornerstone Climate", "Apex Heating & Air",
  "Benchmark HVAC", "Total Comfort Services", "Residential HVAC Pros",
  "Commercial Climate Solutions",
];

export function generateMockLeads(
  location: string,
  count: number = 25
): ScoredLead[] {
  const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const raw: RawLead[] = [];

  for (let i = 0; i < count; i++) {
    const reviews = rng(8, 380);
    const rating = Math.round((3.2 + Math.random() * 1.8) * 10) / 10;
    raw.push({
      name: MOCK_BUSINESS_NAMES[i % MOCK_BUSINESS_NAMES.length] + (i >= MOCK_BUSINESS_NAMES.length ? ` ${Math.floor(i / MOCK_BUSINESS_NAMES.length) + 1}` : ""),
      phone: `(${rng(200, 999)}) ${rng(200, 999)}-${rng(1000, 9999)}`,
      website: Math.random() > 0.3 ? `https://www.${MOCK_BUSINESS_NAMES[i % MOCK_BUSINESS_NAMES.length].toLowerCase().replace(/\s+/g, "")}.com` : undefined,
      address: `${rng(100, 9999)} ${["Main St", "Oak Ave", "Commerce Dr", "Industrial Blvd"][rng(0, 3)]}, ${location}`,
      city: location,
      state: "US",
      rating,
      reviewCount: reviews,
      placeId: `mock_${i}_${Date.now()}`,
    });
  }

  return scoreLeads(raw);
}
