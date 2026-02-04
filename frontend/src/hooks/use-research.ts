"use client";

/**
 * Research Data Hooks
 *
 * SWR hooks for fetching research reports, topics, and industries.
 */
import useSWR from "swr";
import { researchService } from "@/services/api/research";
import type {
  ResearchReport,
  ResearchListResponse,
  ResearchFilters,
  Topic,
  Industry,
} from "@/services/api/research";

// =========================
// Topics
// =========================

export function useTopics() {
  return useSWR<Topic[]>(
    "/research/topics/",
    () => researchService.getTopics(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

export function useTopic(slug: string | null) {
  return useSWR<Topic>(
    slug ? `/research/topics/${slug}/` : null,
    () => researchService.getTopic(slug!),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useFeaturedTopics() {
  return useSWR<Topic[]>(
    "/research/topics/featured/",
    () => researchService.getFeaturedTopics(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

// =========================
// Industries
// =========================

export function useIndustries() {
  return useSWR<Industry[]>(
    "/research/industries/",
    () => researchService.getIndustries(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

export function useIndustry(slug: string | null) {
  return useSWR<Industry>(
    slug ? `/research/industries/${slug}/` : null,
    () => researchService.getIndustry(slug!),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useFeaturedIndustries() {
  return useSWR<Industry[]>(
    "/research/industries/featured/",
    () => researchService.getFeaturedIndustries(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );
}

// =========================
// Research Reports
// =========================

export interface UseResearchReportsParams extends ResearchFilters {}

export function useResearchReports(params?: UseResearchReportsParams) {
  const paramString = params ? JSON.stringify(params) : "";
  const key = `/research/reports/?${paramString}`;

  return useSWR<ResearchListResponse>(
    key,
    () => researchService.getReports(params),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );
}

export function useResearchReport(slug: string | null) {
  return useSWR<ResearchReport>(
    slug ? `/research/reports/${slug}/` : null,
    () => researchService.getReport(slug!),
    {
      revalidateOnFocus: false,
    }
  );
}

export function useFeaturedResearchReports() {
  return useSWR<ResearchReport[]>(
    "/research/reports/featured/",
    () => researchService.getFeaturedReports(),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );
}
