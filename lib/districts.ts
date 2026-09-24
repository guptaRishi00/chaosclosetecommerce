import assam from "@/lib/data/assam-districts.json";

// Customers type their district as free text; the map uses the 27 Census-2011 Assam districts
// (lib/data/assam-districts.json, DataMeet CC BY 4.0). This resolves text → map district.

export type MapDistrict = { name: string; d: string; cx: number; cy: number };
export const ASSAM_MAP = assam as { source: string; viewBox: string; districts: MapDistrict[] };

const norm = (s: string) => s.toLowerCase().replace(/district/g, "").replace(/[^a-z]/g, "");

// Districts created after 2011 → the 2011 district they were carved from; plus common spellings/cities.
const ALIASES: Record<string, string> = {
  majuli: "Jorhat",
  charaideo: "Sivasagar",
  biswanath: "Sonitpur",
  hojai: "Nagaon",
  southsalmaramankachar: "Dhubri",
  southsalmara: "Dhubri",
  westkarbianglong: "Karbi Anglong",
  eastkarbianglong: "Karbi Anglong",
  tamulpur: "Baksa",
  bajali: "Barpeta",
  morigaon: "Marigaon",
  sibsagar: "Sivasagar",
  sivsagar: "Sivasagar",
  northlakhimpur: "Lakhimpur",
  northcacharhills: "Dima Hasao",
  kamrupmetro: "Kamrup Metropolitan",
  kamrupmetropolitan: "Kamrup Metropolitan",
  guwahati: "Kamrup Metropolitan",
  kamruprural: "Kamrup",
  tezpur: "Sonitpur",
  silchar: "Cachar",
  dispur: "Kamrup Metropolitan",
};

const BY_NORM = new Map(ASSAM_MAP.districts.map((d) => [norm(d.name), d.name]));

/** Free-text district → a map district name, or null if it isn't (recognisably) in Assam. */
export function resolveAssamDistrict(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = norm(raw);
  if (!key) return null;
  return BY_NORM.get(key) ?? ALIASES[key] ?? null;
}
