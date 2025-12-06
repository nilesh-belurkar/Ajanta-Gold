import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PaginationUtilService {

  getVisiblePages(currentPage: number, totalPages: number, maxPages: number = 5): number[] {

    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = currentPage - Math.floor(maxPages / 2);
    let end = currentPage + Math.floor(maxPages / 2);

    if (start < 1) {
      start = 1;
      end = maxPages;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxPages + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
