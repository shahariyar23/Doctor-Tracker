import { useQuery } from "@tanstack/react-query";
import { searchService } from "@/services/search-service";
import { useDebounce } from "@/hooks/use-debounce";
import type { GlobalSearchData } from "@/types/search";

export function useGlobalSearch(searchTerm: string, limit: number = 5) {
  const debouncedTerm = useDebounce(searchTerm.trim(), 300);
  const isQueryValid = debouncedTerm.length >= 2;

  const query = useQuery<GlobalSearchData>({
    queryKey: ["global-search", debouncedTerm, limit],
    queryFn: ({ signal }) => searchService.globalSearch(debouncedTerm, limit, signal),
    enabled: isQueryValid,
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });

  return {
    ...query,
    debouncedTerm,
    isQueryValid,
    isSearching: query.isLoading && isQueryValid,
  };
}

