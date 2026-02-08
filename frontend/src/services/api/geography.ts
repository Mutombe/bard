/**
 * Geography API Service
 * Handles regions and countries
 */
import { authClient, publicClient } from "./client";

// Types
export interface Region {
  code: string;
  name: string;
  country_count: number;
  total_gdp?: number;
  total_population?: number;
  exchange_count?: number;
  countries?: Country[];
}

export interface Country {
  id: string;
  name: string;
  code: string;
  region: string;
  region_display?: string;
  capital?: string;
  currency_code?: string;
  currency_name?: string;
  currency_symbol?: string;
  gdp?: number;
  population?: number;
  is_featured?: boolean;
  is_active?: boolean;
  flag_emoji?: string;
  has_stock_exchange?: boolean;
}

export interface CountryFilters {
  region?: string;
  is_featured?: boolean;
  has_stock_exchange?: boolean;
  search?: string;
}

// API Service
export const geographyService = {
  // Regions
  async getRegions(): Promise<Region[]> {
    const response = await publicClient.get("/geography/regions/");
    return response.data;
  },

  async getRegion(code: string): Promise<Region> {
    const response = await publicClient.get(`/geography/regions/${code}/`);
    return response.data;
  },

  // Countries
  async getCountries(filters?: CountryFilters): Promise<Country[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const response = await publicClient.get(`/geography/countries/?${params.toString()}`);
    return response.data.results || response.data;
  },

  async getCountry(code: string): Promise<Country> {
    const response = await publicClient.get(`/geography/countries/${code}/`);
    return response.data;
  },

  async getCountriesByRegion(): Promise<Record<string, Country[]>> {
    const response = await publicClient.get("/geography/countries/by-region/");
    return response.data;
  },

  // Admin endpoints
  async updateCountry(code: string, data: Partial<Country>): Promise<Country> {
    const response = await authClient.patch(`/geography/countries/${code}/`, data);
    return response.data;
  },

  async toggleCountryFeatured(code: string): Promise<Country> {
    const country = await this.getCountry(code);
    return this.updateCountry(code, { is_featured: !country.is_featured });
  },
};

export default geographyService;
