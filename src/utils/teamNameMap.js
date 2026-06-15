// Maps football-data.org API team names to the spellings used in our sweepstake draw.
// Keys are API names, values are our canonical names.
export const MAP = {
  "Korea Republic": "South Korea",
  "Republic of Korea": "South Korea",
  "South Korea": "South Korea",
  "Bosnia and Herzegovina": "Bosnia",
  "Bosnia-Herzegovina": "Bosnia",
  "Ivory Coast": "Cote d'Ivoire",
  "Côte d'Ivoire": "Cote d'Ivoire",
  "Cote d'Ivoire": "Cote d'Ivoire",
  "DR Congo": "Congo DR",
  "Congo DR": "Congo DR",
  "Democratic Republic of the Congo": "Congo DR",
  "Congo": "Congo DR",
  "United States": "USA",
  "United States of America": "USA",
  "USA": "USA",
  "Czech Republic": "Czechia",
  "Cabo Verde": "Cape Verde",
  "Cape Verde Islands": "Cape Verde",
  "Curaçao": "Curacao",
  "Türkiye": "Turkey",
  "Turkiye": "Turkey",
  "Netherlands": "Netherlands",
  "Holland": "Netherlands",
  "England": "England",
  "Iran (Islamic Republic of)": "Iran",
  "IR Iran": "Iran",
  "Saudi Arabia": "Saudi Arabia",
  "New Zealand": "New Zealand",
  "South Africa": "South Africa"
};

// Returns our canonical sweepstake name for an API team name,
// or the original name unchanged if no mapping exists.
export function getCanonicalName(apiName) {
  if (apiName == null) return apiName;
  return MAP[apiName] || apiName;
}
