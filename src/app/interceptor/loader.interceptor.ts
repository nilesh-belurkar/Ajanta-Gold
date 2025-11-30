import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';
let requestsInProgress = 0;

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(NgxSpinnerService);
  
  requestsInProgress++;
  spinner.show();

  return next(req).pipe(
    finalize(() => {
      requestsInProgress--;
      if (requestsInProgress <= 0) {
        requestsInProgress = 0;
        spinner.hide();
      }
    })
  );
};
