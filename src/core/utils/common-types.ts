export type SortDirection = 'asc' | 'desc';

export type DateRange = [Date, Date | undefined];

export interface EntitySelection<TItem, TParams> {
  items: TItem[];
  params: TParams;
  totalCount: number;
}

export interface Action {
  label: string;
  url?: string;
  onExecute?: () => void;
}
