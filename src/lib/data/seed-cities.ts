/**
 * Seed cities for activity pairing pages (/near/[location])
 * 54 cities in spring-rich states for SEO pages like "Hot Springs Near Denver"
 */

export interface SeedCity {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const SEED_CITIES: SeedCity[] = [
  // CALIFORNIA (8 cities)
  { slug: 'san-francisco-ca', name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { slug: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { slug: 'san-diego-ca', name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { slug: 'sacramento-ca', name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { slug: 'fresno-ca', name: 'Fresno', state: 'CA', lat: 36.7378, lng: -119.7871 },
  { slug: 'mammoth-lakes-ca', name: 'Mammoth Lakes', state: 'CA', lat: 37.6485, lng: -118.9721 },
  { slug: 'bishop-ca', name: 'Bishop', state: 'CA', lat: 37.3636, lng: -118.3951 },
  { slug: 'palm-springs-ca', name: 'Palm Springs', state: 'CA', lat: 33.8303, lng: -116.5453 },

  // COLORADO (5 cities)
  { slug: 'denver-co', name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { slug: 'boulder-co', name: 'Boulder', state: 'CO', lat: 40.015, lng: -105.2705 },
  { slug: 'colorado-springs-co', name: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214 },
  { slug: 'durango-co', name: 'Durango', state: 'CO', lat: 37.2753, lng: -107.8801 },
  { slug: 'glenwood-springs-co', name: 'Glenwood Springs', state: 'CO', lat: 39.5505, lng: -107.3248 },

  // IDAHO (4 cities)
  { slug: 'boise-id', name: 'Boise', state: 'ID', lat: 43.615, lng: -116.2023 },
  { slug: 'idaho-falls-id', name: 'Idaho Falls', state: 'ID', lat: 43.4666, lng: -112.034 },
  { slug: 'twin-falls-id', name: 'Twin Falls', state: 'ID', lat: 42.5558, lng: -114.4608 },
  { slug: 'mccall-id', name: 'McCall', state: 'ID', lat: 44.911, lng: -116.0986 },

  // OREGON (4 cities)
  { slug: 'portland-or', name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { slug: 'bend-or', name: 'Bend', state: 'OR', lat: 44.0582, lng: -121.3153 },
  { slug: 'eugene-or', name: 'Eugene', state: 'OR', lat: 44.0521, lng: -123.0868 },
  { slug: 'medford-or', name: 'Medford', state: 'OR', lat: 42.3265, lng: -122.8756 },

  // NEVADA (4 cities)
  { slug: 'reno-nv', name: 'Reno', state: 'NV', lat: 39.5296, lng: -119.8138 },
  { slug: 'las-vegas-nv', name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { slug: 'elko-nv', name: 'Elko', state: 'NV', lat: 40.8324, lng: -115.7631 },
  { slug: 'winnemucca-nv', name: 'Winnemucca', state: 'NV', lat: 40.973, lng: -117.7357 },

  // UTAH (4 cities)
  { slug: 'salt-lake-city-ut', name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.891 },
  { slug: 'provo-ut', name: 'Provo', state: 'UT', lat: 40.2338, lng: -111.6585 },
  { slug: 'st-george-ut', name: 'St. George', state: 'UT', lat: 37.0965, lng: -113.5684 },
  { slug: 'moab-ut', name: 'Moab', state: 'UT', lat: 38.5733, lng: -109.5498 },

  // ARIZONA (4 cities)
  { slug: 'phoenix-az', name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074 },
  { slug: 'flagstaff-az', name: 'Flagstaff', state: 'AZ', lat: 35.1983, lng: -111.6513 },
  { slug: 'tucson-az', name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  { slug: 'sedona-az', name: 'Sedona', state: 'AZ', lat: 34.8697, lng: -111.761 },

  // NEW MEXICO (3 cities)
  { slug: 'albuquerque-nm', name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
  { slug: 'santa-fe-nm', name: 'Santa Fe', state: 'NM', lat: 35.687, lng: -105.9378 },
  { slug: 'taos-nm', name: 'Taos', state: 'NM', lat: 36.4072, lng: -105.5731 },

  // MONTANA (4 cities)
  { slug: 'missoula-mt', name: 'Missoula', state: 'MT', lat: 46.8721, lng: -114.0001 },
  { slug: 'bozeman-mt', name: 'Bozeman', state: 'MT', lat: 45.677, lng: -111.0429 },
  { slug: 'billings-mt', name: 'Billings', state: 'MT', lat: 45.7833, lng: -108.5007 },
  { slug: 'helena-mt', name: 'Helena', state: 'MT', lat: 46.5891, lng: -112.0391 },

  // WYOMING (3 cities)
  { slug: 'jackson-wy', name: 'Jackson', state: 'WY', lat: 43.4799, lng: -110.7624 },
  { slug: 'cody-wy', name: 'Cody', state: 'WY', lat: 44.5263, lng: -109.0565 },
  { slug: 'lander-wy', name: 'Lander', state: 'WY', lat: 42.833, lng: -108.7307 },

  // WASHINGTON (3 cities)
  { slug: 'seattle-wa', name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { slug: 'spokane-wa', name: 'Spokane', state: 'WA', lat: 47.6588, lng: -117.426 },
  { slug: 'olympia-wa', name: 'Olympia', state: 'WA', lat: 47.0379, lng: -122.9007 },

  // TEXAS (2 cities)
  { slug: 'austin-tx', name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { slug: 'big-bend-tx', name: 'Big Bend', state: 'TX', lat: 29.25, lng: -103.25 },

  // ALASKA (2 cities)
  { slug: 'anchorage-ak', name: 'Anchorage', state: 'AK', lat: 61.2181, lng: -149.9003 },
  { slug: 'fairbanks-ak', name: 'Fairbanks', state: 'AK', lat: 64.8378, lng: -147.7164 },

  // ARKANSAS (1 city)
  { slug: 'hot-springs-ar', name: 'Hot Springs', state: 'AR', lat: 34.5037, lng: -93.0552 },

  // NORTH CAROLINA (1 city - swimming holes)
  { slug: 'asheville-nc', name: 'Asheville', state: 'NC', lat: 35.5951, lng: -82.5515 },

  // TENNESSEE (1 city - swimming holes)
  { slug: 'knoxville-tn', name: 'Knoxville', state: 'TN', lat: 35.9606, lng: -83.9207 },

  // VIRGINIA (1 city - swimming holes)
  { slug: 'charlottesville-va', name: 'Charlottesville', state: 'VA', lat: 38.0293, lng: -78.4767 },
];
