import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import {
  AvatarComponent,
  BadgeComponent,
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  NavItemComponent,
  NavLinkDirective,
  SidebarToggleDirective
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';
import { LoginService } from '../../../login/services/login.service';
import { CommonService } from '../../../invoice/common/services/common.service';
import { User } from './models/user.model'
import { take } from 'rxjs';
import { USERS_COLLECTION_NAME } from '../../../invoice/common/constants/constant';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, NavLinkDirective, NgTemplateOutlet, BreadcrumbRouterComponent, DropdownComponent, DropdownToggleDirective, AvatarComponent, DropdownMenuDirective, DropdownItemDirective, DropdownDividerDirective]
})
export class DefaultHeaderComponent extends HeaderComponent {
  private _loginService = inject(LoginService);
  private _router = inject(Router);
  private _commonService = inject(CommonService);
  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;

  currentUser: User | null = null;

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' },
    { name: 'auto', text: 'Auto', icon: 'cilContrast' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  constructor() {
    super();
    this.getCurrentUser();
  }

  sidebarId = input('sidebar1');

  logout() {
    this._loginService.logout().then(() => {
      this._router.navigate(['/guest']);
    });
  }

 getCurrentUser() {
  return this._commonService.getCurrentUserProfile(USERS_COLLECTION_NAME).pipe(take(1))
    .subscribe((user: User | null) => {
      if (!user) {
        this.currentUser = null;
        return;
      }
      this.currentUser = user;
    });
}
}
