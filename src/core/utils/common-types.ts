export type SortDirection = 'asc' | 'desc';

export type DateRange = [Date, Date | undefined];

export interface EntitySelection<TItem, TParams> {
  items: TItem[];
  params: TParams;
  totalCount: number;
}
