import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

export const AuthGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const auth = inject(Auth);

  const user = await new Promise((resolve) => {
    onAuthStateChanged(auth, (u) => resolve(u));
  });

  if (user) {
    return true;
  }

  return router.parseUrl('/login');
};
