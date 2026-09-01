/**
 * Enum fo order
 */
export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface Pagination {
  page?: number;
  limit?: number;
  order?: Order;
  filterByFirstName?: string;
  filterByLastName?: string;
  filterByFaithForge?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
}

