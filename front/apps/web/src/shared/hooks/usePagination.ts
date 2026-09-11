import { useState } from 'react';

export function usePagination(initialPage: number = 1, initialLimit: number = 12) {
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

  const resetPage = () => setPage(1);

  return {
    page,
    limit,
    setPage,
    setLimit,
    resetPage,
  };
}
