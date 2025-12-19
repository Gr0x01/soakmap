/**
 * Seed cities for activity pairing pages (/near/[location])
 * 15 major cities in spring-rich states for SEO pages like "Hot Springs Near Denver"
 */

export interface SeedCity {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const SEED_CITIES: SeedCity[] = [
  // Colorado
  { slug: 'denver-co', name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { slug: 'boulder-co', name: 'Boulder', state: 'CO', lat: 40.015, lng: -105.2705 },

  // Idaho
  { slug: 'boise-id', name: 'Boise', state: 'ID', lat: 43.615, lng: -116.2023 },

  // Utah
  { slug: 'salt-lake-city-ut', name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.891 },

  // Texas
  { slug: 'austin-tx', name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },

  // Oregon
  { slug: 'portland-or', name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { slug: 'bend-or', name: 'Bend', state: 'OR', lat: 44.0582, lng: -121.3153 },

  // Washington
  { slug: 'seattle-wa', name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },

  // California
  { slug: 'san-francisco-ca', name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { slug: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },

  // Arizona
  { slug: 'phoenix-az', name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074 },
  { slug: 'flagstaff-az', name: 'Flagstaff', state: 'AZ', lat: 35.1983, lng: -111.6513 },

  // New Mexico
  { slug: 'albuquerque-nm', name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },

  // Nevada
  { slug: 'reno-nv', name: 'Reno', state: 'NV', lat: 39.5296, lng: -119.8138 },

  // Montana
  { slug: 'missoula-mt', name: 'Missoula', state: 'MT', lat: 46.8721, lng: -114.0001 },
];
