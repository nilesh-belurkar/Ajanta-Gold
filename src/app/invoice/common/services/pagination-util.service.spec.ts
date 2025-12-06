import { TestBed } from '@angular/core/testing';

import { PaginationUtilService } from './pagination-util.service';

describe('PaginationUtilService', () => {
  let service: PaginationUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
