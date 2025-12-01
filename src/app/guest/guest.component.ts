import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbCarousel, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { CommonService } from '../invoice/common/services/common.service';
import { ORDER_LIST } from '../invoice/common/constants/constant';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';



@Component({
  selector: 'app-guest',
  imports: [TranslatePipe, FormsModule, ReactiveFormsModule, CommonModule, NgbCarouselModule, RouterModule],
  templateUrl: './guest.component.html',
  styleUrl: './guest.component.scss'
})
export class GuestComponent implements OnInit {
  private _translateService = inject(TranslateService);
  public _commonService = inject(CommonService);
  public _toastrService = inject(ToastrService);
  public _formBuilder = inject(FormBuilder);

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
  orderForm!: FormGroup;

  constructor() {
    this._translateService.addLangs(['en', 'hi', 'mr']);
    this._translateService.use('en');
  }

  switchLanguage(lang: string) {
    this.currentlanguage = lang;
    this._translateService.use(lang);
  }

  ngOnInit(): void {
    this.initOrderForm();
  }

  initOrderForm(): void {
    this.orderForm = this._formBuilder.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      orderDetails: ['', [Validators.required, Validators.minLength(5)]],
      status: ['Pending'],
    });
  }


  onSubmitOrderForm() {
    this.isOrderFormSubmitted = true;
    if (this.orderForm.valid) {
      this._commonService.addDoc(ORDER_LIST, this.orderForm.value).then(() => {
        this._toastrService.success('Order placed successfully', 'Success');
        this.orderForm.reset({
          status: 'Pending'
        });
        this.isOrderFormSubmitted = false;
      }).catch((error) => {
        alert('Error submitting order: ' + error);
      });
    }
  }

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

  allowOnlyNumbers(event: KeyboardEvent) {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }
}
