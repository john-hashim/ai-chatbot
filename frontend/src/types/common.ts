export const sortOptions = ['Default', 'Oldest', 'Newest', 'Alphabetical(A-Z)', 'Alphabetical(Z-A)'] as const;
const chatSessionSortOptions = ['Default', 'Oldest', 'Newest'] as const;

export type SortOption = typeof sortOptions[number]

export type ChatSessionSortOption = typeof chatSessionSortOptions[number]

/**
 * Filter is a generic type that accepts a custom SortOptions.
 * Pass in the page or feature specific sort options type.
 * SortOption type is default Generic type for Filter.
 */
export interface Filter<S = SortOption> {
  searchParam: string
  sortBy: S
}
