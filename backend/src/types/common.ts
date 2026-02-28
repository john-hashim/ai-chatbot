// TODO: Needs to be put into a common file
type SortDir = "asc" | "desc";
export type NestedSort = {
  [key: string]: SortDir | NestedSort;
};