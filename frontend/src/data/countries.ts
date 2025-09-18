export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  subRegion?: string;
}

export interface CountryRegion {
  name: string;
  countries: Country[];
}

// Comprehensive list of countries based on ISO 3166-1 alpha-2 standard
export const COUNTRIES: Country[] = [
  // Africa
  { code: 'DZ', name: 'Algeria', region: 'Africa', subRegion: 'North Africa' },
  { code: 'AO', name: 'Angola', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'BJ', name: 'Benin', region: 'Africa', subRegion: 'West Africa' },
  { code: 'BW', name: 'Botswana', region: 'Africa', subRegion: 'Southern Africa' },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa', subRegion: 'West Africa' },
  { code: 'BI', name: 'Burundi', region: 'Africa', subRegion: 'East Africa' },
  { code: 'CV', name: 'Cabo Verde', region: 'Africa', subRegion: 'West Africa' },
  { code: 'CM', name: 'Cameroon', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'CF', name: 'Central African Republic', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'TD', name: 'Chad', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'KM', name: 'Comoros', region: 'Africa', subRegion: 'East Africa' },
  { code: 'CG', name: 'Congo', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'CD', name: 'Congo (Democratic Republic)', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'CI', name: 'Côte d\'Ivoire', region: 'Africa', subRegion: 'West Africa' },
  { code: 'DJ', name: 'Djibouti', region: 'Africa', subRegion: 'East Africa' },
  { code: 'EG', name: 'Egypt', region: 'Africa', subRegion: 'North Africa' },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'ER', name: 'Eritrea', region: 'Africa', subRegion: 'East Africa' },
  { code: 'SZ', name: 'Eswatini', region: 'Africa', subRegion: 'Southern Africa' },
  { code: 'ET', name: 'Ethiopia', region: 'Africa', subRegion: 'East Africa' },
  { code: 'GA', name: 'Gabon', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'GM', name: 'Gambia', region: 'Africa', subRegion: 'West Africa' },
  { code: 'GH', name: 'Ghana', region: 'Africa', subRegion: 'West Africa' },
  { code: 'GN', name: 'Guinea', region: 'Africa', subRegion: 'West Africa' },
  { code: 'GW', name: 'Guinea-Bissau', region: 'Africa', subRegion: 'West Africa' },
  { code: 'KE', name: 'Kenya', region: 'Africa', subRegion: 'East Africa' },
  { code: 'LS', name: 'Lesotho', region: 'Africa', subRegion: 'Southern Africa' },
  { code: 'LR', name: 'Liberia', region: 'Africa', subRegion: 'West Africa' },
  { code: 'LY', name: 'Libya', region: 'Africa', subRegion: 'North Africa' },
  { code: 'MG', name: 'Madagascar', region: 'Africa', subRegion: 'East Africa' },
  { code: 'MW', name: 'Malawi', region: 'Africa', subRegion: 'East Africa' },
  { code: 'ML', name: 'Mali', region: 'Africa', subRegion: 'West Africa' },
  { code: 'MR', name: 'Mauritania', region: 'Africa', subRegion: 'West Africa' },
  { code: 'MU', name: 'Mauritius', region: 'Africa', subRegion: 'East Africa' },
  { code: 'MA', name: 'Morocco', region: 'Africa', subRegion: 'North Africa' },
  { code: 'MZ', name: 'Mozambique', region: 'Africa', subRegion: 'East Africa' },
  { code: 'NA', name: 'Namibia', region: 'Africa', subRegion: 'Southern Africa' },
  { code: 'NE', name: 'Niger', region: 'Africa', subRegion: 'West Africa' },
  { code: 'NG', name: 'Nigeria', region: 'Africa', subRegion: 'West Africa' },
  { code: 'RW', name: 'Rwanda', region: 'Africa', subRegion: 'East Africa' },
  { code: 'ST', name: 'São Tomé and Príncipe', region: 'Africa', subRegion: 'Middle Africa' },
  { code: 'SN', name: 'Senegal', region: 'Africa', subRegion: 'West Africa' },
  { code: 'SC', name: 'Seychelles', region: 'Africa', subRegion: 'East Africa' },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa', subRegion: 'West Africa' },
  { code: 'SO', name: 'Somalia', region: 'Africa', subRegion: 'East Africa' },
  { code: 'ZA', name: 'South Africa', region: 'Africa', subRegion: 'Southern Africa' },
  { code: 'SS', name: 'South Sudan', region: 'Africa', subRegion: 'East Africa' },
  { code: 'SD', name: 'Sudan', region: 'Africa', subRegion: 'North Africa' },
  { code: 'TZ', name: 'Tanzania', region: 'Africa', subRegion: 'East Africa' },
  { code: 'TG', name: 'Togo', region: 'Africa', subRegion: 'West Africa' },
  { code: 'TN', name: 'Tunisia', region: 'Africa', subRegion: 'North Africa' },
  { code: 'UG', name: 'Uganda', region: 'Africa', subRegion: 'East Africa' },
  { code: 'ZM', name: 'Zambia', region: 'Africa', subRegion: 'East Africa' },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', subRegion: 'East Africa' },

  // Asia
  { code: 'AF', name: 'Afghanistan', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'AM', name: 'Armenia', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'AZ', name: 'Azerbaijan', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'BH', name: 'Bahrain', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'BT', name: 'Bhutan', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'BN', name: 'Brunei', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'KH', name: 'Cambodia', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'CN', name: 'China', region: 'Asia', subRegion: 'Eastern Asia' },
  { code: 'CY', name: 'Cyprus', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'GE', name: 'Georgia', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'IN', name: 'India', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'ID', name: 'Indonesia', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'IR', name: 'Iran', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'IQ', name: 'Iraq', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'IL', name: 'Israel', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'JP', name: 'Japan', region: 'Asia', subRegion: 'Eastern Asia' },
  { code: 'JO', name: 'Jordan', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'KZ', name: 'Kazakhstan', region: 'Asia', subRegion: 'Central Asia' },
  { code: 'KW', name: 'Kuwait', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'KG', name: 'Kyrgyzstan', region: 'Asia', subRegion: 'Central Asia' },
  { code: 'LA', name: 'Laos', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'LB', name: 'Lebanon', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'MY', name: 'Malaysia', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'MV', name: 'Maldives', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'MN', name: 'Mongolia', region: 'Asia', subRegion: 'Eastern Asia' },
  { code: 'MM', name: 'Myanmar', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'NP', name: 'Nepal', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'KP', name: 'North Korea', region: 'Asia', subRegion: 'Eastern Asia' },
  { code: 'OM', name: 'Oman', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'PK', name: 'Pakistan', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'PS', name: 'Palestine', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'PH', name: 'Philippines', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'QA', name: 'Qatar', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'SG', name: 'Singapore', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'KR', name: 'South Korea', region: 'Asia', subRegion: 'Eastern Asia' },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia', subRegion: 'Southern Asia' },
  { code: 'SY', name: 'Syria', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'TW', name: 'Taiwan', region: 'Asia', subRegion: 'Eastern Asia' },
  { code: 'TJ', name: 'Tajikistan', region: 'Asia', subRegion: 'Central Asia' },
  { code: 'TH', name: 'Thailand', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'TL', name: 'Timor-Leste', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'TR', name: 'Turkey', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'TM', name: 'Turkmenistan', region: 'Asia', subRegion: 'Central Asia' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Asia', subRegion: 'Western Asia' },
  { code: 'UZ', name: 'Uzbekistan', region: 'Asia', subRegion: 'Central Asia' },
  { code: 'VN', name: 'Vietnam', region: 'Asia', subRegion: 'South-Eastern Asia' },
  { code: 'YE', name: 'Yemen', region: 'Asia', subRegion: 'Western Asia' },

  // Europe
  { code: 'AL', name: 'Albania', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'AD', name: 'Andorra', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'AT', name: 'Austria', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'BY', name: 'Belarus', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'BA', name: 'Bosnia and Herzegovina', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'BG', name: 'Bulgaria', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'HR', name: 'Croatia', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'DK', name: 'Denmark', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'EE', name: 'Estonia', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'FI', name: 'Finland', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'FR', name: 'France', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'DE', name: 'Germany', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'GR', name: 'Greece', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'HU', name: 'Hungary', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'IS', name: 'Iceland', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'IE', name: 'Ireland', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'IT', name: 'Italy', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'XK', name: 'Kosovo', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'LV', name: 'Latvia', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'LI', name: 'Liechtenstein', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'LT', name: 'Lithuania', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'LU', name: 'Luxembourg', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'MT', name: 'Malta', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'MD', name: 'Moldova', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'MC', name: 'Monaco', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'ME', name: 'Montenegro', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'MK', name: 'North Macedonia', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'PL', name: 'Poland', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'RO', name: 'Romania', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'RU', name: 'Russia', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'SM', name: 'San Marino', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'RS', name: 'Serbia', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'SK', name: 'Slovakia', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'SI', name: 'Slovenia', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'ES', name: 'Spain', region: 'Europe', subRegion: 'Southern Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe', subRegion: 'Western Europe' },
  { code: 'UA', name: 'Ukraine', region: 'Europe', subRegion: 'Eastern Europe' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', subRegion: 'Northern Europe' },
  { code: 'VA', name: 'Vatican City', region: 'Europe', subRegion: 'Southern Europe' },

  // North America
  { code: 'AG', name: 'Antigua and Barbuda', region: 'North America', subRegion: 'Caribbean' },
  { code: 'BS', name: 'Bahamas', region: 'North America', subRegion: 'Caribbean' },
  { code: 'BB', name: 'Barbados', region: 'North America', subRegion: 'Caribbean' },
  { code: 'BZ', name: 'Belize', region: 'North America', subRegion: 'Central America' },
  { code: 'CA', name: 'Canada', region: 'North America', subRegion: 'Northern America' },
  { code: 'CR', name: 'Costa Rica', region: 'North America', subRegion: 'Central America' },
  { code: 'CU', name: 'Cuba', region: 'North America', subRegion: 'Caribbean' },
  { code: 'DM', name: 'Dominica', region: 'North America', subRegion: 'Caribbean' },
  { code: 'DO', name: 'Dominican Republic', region: 'North America', subRegion: 'Caribbean' },
  { code: 'SV', name: 'El Salvador', region: 'North America', subRegion: 'Central America' },
  { code: 'GD', name: 'Grenada', region: 'North America', subRegion: 'Caribbean' },
  { code: 'GT', name: 'Guatemala', region: 'North America', subRegion: 'Central America' },
  { code: 'HT', name: 'Haiti', region: 'North America', subRegion: 'Caribbean' },
  { code: 'HN', name: 'Honduras', region: 'North America', subRegion: 'Central America' },
  { code: 'JM', name: 'Jamaica', region: 'North America', subRegion: 'Caribbean' },
  { code: 'MX', name: 'Mexico', region: 'North America', subRegion: 'Central America' },
  { code: 'NI', name: 'Nicaragua', region: 'North America', subRegion: 'Central America' },
  { code: 'PA', name: 'Panama', region: 'North America', subRegion: 'Central America' },
  { code: 'KN', name: 'Saint Kitts and Nevis', region: 'North America', subRegion: 'Caribbean' },
  { code: 'LC', name: 'Saint Lucia', region: 'North America', subRegion: 'Caribbean' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', region: 'North America', subRegion: 'Caribbean' },
  { code: 'TT', name: 'Trinidad and Tobago', region: 'North America', subRegion: 'Caribbean' },
  { code: 'US', name: 'United States', region: 'North America', subRegion: 'Northern America' },

  // South America
  { code: 'AR', name: 'Argentina', region: 'South America', subRegion: 'South America' },
  { code: 'BO', name: 'Bolivia', region: 'South America', subRegion: 'South America' },
  { code: 'BR', name: 'Brazil', region: 'South America', subRegion: 'South America' },
  { code: 'CL', name: 'Chile', region: 'South America', subRegion: 'South America' },
  { code: 'CO', name: 'Colombia', region: 'South America', subRegion: 'South America' },
  { code: 'EC', name: 'Ecuador', region: 'South America', subRegion: 'South America' },
  { code: 'GY', name: 'Guyana', region: 'South America', subRegion: 'South America' },
  { code: 'PY', name: 'Paraguay', region: 'South America', subRegion: 'South America' },
  { code: 'PE', name: 'Peru', region: 'South America', subRegion: 'South America' },
  { code: 'SR', name: 'Suriname', region: 'South America', subRegion: 'South America' },
  { code: 'UY', name: 'Uruguay', region: 'South America', subRegion: 'South America' },
  { code: 'VE', name: 'Venezuela', region: 'South America', subRegion: 'South America' },

  // Oceania
  { code: 'AU', name: 'Australia', region: 'Oceania', subRegion: 'Australia and New Zealand' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania', subRegion: 'Melanesia' },
  { code: 'KI', name: 'Kiribati', region: 'Oceania', subRegion: 'Micronesia' },
  { code: 'MH', name: 'Marshall Islands', region: 'Oceania', subRegion: 'Micronesia' },
  { code: 'FM', name: 'Micronesia', region: 'Oceania', subRegion: 'Micronesia' },
  { code: 'NR', name: 'Nauru', region: 'Oceania', subRegion: 'Micronesia' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania', subRegion: 'Australia and New Zealand' },
  { code: 'PW', name: 'Palau', region: 'Oceania', subRegion: 'Micronesia' },
  { code: 'PG', name: 'Papua New Guinea', region: 'Oceania', subRegion: 'Melanesia' },
  { code: 'WS', name: 'Samoa', region: 'Oceania', subRegion: 'Polynesia' },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania', subRegion: 'Melanesia' },
  { code: 'TO', name: 'Tonga', region: 'Oceania', subRegion: 'Polynesia' },
  { code: 'TV', name: 'Tuvalu', region: 'Oceania', subRegion: 'Polynesia' },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania', subRegion: 'Melanesia' },
];

// Group countries by region
export const COUNTRIES_BY_REGION: CountryRegion[] = [
  {
    name: 'Africa',
    countries: COUNTRIES.filter(country => country.region === 'Africa').sort((a, b) => a.name.localeCompare(b.name))
  },
  {
    name: 'Asia',
    countries: COUNTRIES.filter(country => country.region === 'Asia').sort((a, b) => a.name.localeCompare(b.name))
  },
  {
    name: 'Europe',
    countries: COUNTRIES.filter(country => country.region === 'Europe').sort((a, b) => a.name.localeCompare(b.name))
  },
  {
    name: 'North America',
    countries: COUNTRIES.filter(country => country.region === 'North America').sort((a, b) => a.name.localeCompare(b.name))
  },
  {
    name: 'South America',
    countries: COUNTRIES.filter(country => country.region === 'South America').sort((a, b) => a.name.localeCompare(b.name))
  },
  {
    name: 'Oceania',
    countries: COUNTRIES.filter(country => country.region === 'Oceania').sort((a, b) => a.name.localeCompare(b.name))
  }
];

// OFAC/UN Sanctioned jurisdictions (as of 2024)
export const SANCTIONED_JURISDICTIONS = [
  { code: 'AF', name: 'Afghanistan', reason: 'UN/US Sanctions' },
  { code: 'BY', name: 'Belarus', reason: 'EU/US Sanctions' },
  { code: 'MM', name: 'Myanmar', reason: 'UN/US/EU Sanctions' },
  { code: 'KP', name: 'North Korea', reason: 'UN/US/EU Sanctions' },
  { code: 'RU', name: 'Russia', reason: 'US/EU/UK Sanctions (2022+)' },
  { code: 'SY', name: 'Syria', reason: 'UN/US/EU Sanctions' },
  { code: 'IR', name: 'Iran', reason: 'US Sanctions' },
  { code: 'CU', name: 'Cuba', reason: 'US Sanctions' },
];

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(country => country.code === code);
}

export function getCountriesByRegion(region: string): Country[] {
  return COUNTRIES.filter(country => country.region === region);
}

export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(lowerQuery) ||
    country.code.toLowerCase().includes(lowerQuery) ||
    country.region.toLowerCase().includes(lowerQuery)
  );
}

export function isSanctioned(countryCode: string): boolean {
  return SANCTIONED_JURISDICTIONS.some(sanctioned => sanctioned.code === countryCode);
}