import { Component, inject, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { OrderService } from './services/order.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbCarousel, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-guest',
  imports: [TranslatePipe, FormsModule, ReactiveFormsModule, CommonModule, NgbCarouselModule, RouterModule],
  templateUrl: './guest.component.html',
  styleUrl: './guest.component.scss'
})
export class GuestComponent {
  private _translateService = inject(TranslateService);
  public _orderService = inject(OrderService);
  currentYear: string = '';
  isOrderFormSubmitted: boolean = false;
  currentlanguage: string = 'en';
  paused: boolean = false;
  unpauseOnArrow: boolean = false;
  pauseOnIndicator: boolean = false;
  pauseOnHover: boolean = true;
  pauseOnFocus: boolean = true;
  images = [1, 2, 3].map((n) => `../../../assets/slider/${n}.jpg`);
  @ViewChild('carousel', { static: true }) carousel!: NgbCarousel;

  constructor() {
    this._translateService.addLangs(['en', 'hi', 'mr']);
    this._translateService.use('en');
  }

  switchLanguage(lang: string) {
    this.currentlanguage = lang;
    this._translateService.use(lang);
  }

  onSubmitOrderForm() { }

  onSlide(slideEvent: NgbSlideEvent) {
    if (this.unpauseOnArrow && slideEvent.paused &&
      (slideEvent.source === NgbSlideEventSource.ARROW_LEFT || slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)) {
      this.togglePaused();
    }
    if (this.pauseOnIndicator && !slideEvent.paused && slideEvent.source === NgbSlideEventSource.INDICATOR) {
      this.togglePaused();
    }
  }

  togglePaused() {
    if (this.paused) {
      this.carousel.cycle();
    } else {
      this.carousel.pause();
    }
    this.paused = !this.paused;
  }
}
