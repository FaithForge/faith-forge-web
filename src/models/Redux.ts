export interface ReduxDefaultState<T> {
  data: T[];
  current?: T;
  error?: string;
  loading: boolean;
}

export interface ReduxDefaultStateWithPagination<T> {
  data: T[];
  current?: Partial<T>;
  error?: string;
  loading: boolean;
  currentPage: number;
  totalPages: number;
}

export interface ReduxDefaultStateWithoutData {
  error?: string;
  loading: boolean;
}