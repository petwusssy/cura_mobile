import regionsData from "../data/ph-address/region.json";
import provincesData from "../data/ph-address/province.json";
import citiesData from "../data/ph-address/city.json";
import barangaysByCityData from "../data/ph-address/barangays_by_city.json";

export interface RegionItem {
  id: number;
  psgc_code: string;
  region_name: string;
  region_code: string;
}

export interface ProvinceItem {
  psgc_code: string;
  province_name: string;
  province_code: string;
  region_code: string;
}

export interface CityItem {
  city_code: string;
  city_name: string;
  province_code: string;
  psgc_code: string;
  region_desc: string;
}

const barangaysRecord = barangaysByCityData as Record<string, string[]>;

export const PH_REGIONS: RegionItem[] = regionsData as RegionItem[];
export const PH_PROVINCES: ProvinceItem[] = provincesData as ProvinceItem[];
export const PH_CITIES: CityItem[] = citiesData as CityItem[];

export function getProvincesByRegion(regionCode: string): ProvinceItem[] {
  return PH_PROVINCES.filter((p) => p.region_code === regionCode);
}

export function getCitiesByProvince(provinceCode: string): CityItem[] {
  return PH_CITIES.filter((c) => c.province_code === provinceCode);
}

export function getBarangaysByCity(cityCode: string): string[] {
  return barangaysRecord[cityCode] || [];
}
