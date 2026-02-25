export type SortOption = 'Default' | 'Oldest' | 'Newest' | 'Alphabetical(A-Z)' | 'Alphabetical(Z-A)'

export interface Filter {
  searchParam: string
  sortBy: SortOption
}

