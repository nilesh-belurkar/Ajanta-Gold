import { Component, ComponentRef, EventEmitter, inject, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../../../common/services/common.service';
import { CommonModule } from '@angular/common';
import { ButtonDirective, FormControlDirective, InputGroupComponent, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { AddProduct } from '../../../models/billing.model';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { Product } from '../../../../products/models/product.model';
import { PRODUCT_LIST_COLLECTION_NAME } from '../../../../common/constants/constant';
import { formatDate } from '../../../../common/utility';

@Component({
  selector: 'app-add-product',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    ModalModule,
    CommonModule,
    BsDatepickerModule
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss',
})
export class AddProductComponent {
  addProductFrom!: FormGroup;
  isFormSubmitted: boolean = false;
  productList: Product[] = [];
  filteredProductList: Product[] = [];
  showSuggestions: boolean = false;
  bsConfig = {
    dateInputFormat: 'DD-MM-YYYY',
    containerClass: 'theme-dark-blue',
    showWeekNumbers: false,
  };

  @Output() saved = new EventEmitter<AddProduct>();
  @Output() closed = new EventEmitter<void>();
  private _toastrService = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _formBuilder = inject(FormBuilder);
  private _spinner = inject(NgxSpinnerService);

  save() {
    this.isFormSubmitted = true;
    if (this.addProductFrom.valid) {
      this.addProductFrom.value.expiryDate = formatDate(this.addProductFrom.value.expiryDate),
      this.saved.emit(this.addProductFrom.value);
    }
  }

  clear() {
    this.addProductFrom.reset();
    this.isFormSubmitted = false;
    this.closed.emit();
  }

  ngOnInit(): void {
    this.initAddProductForm();
    this.loadProducts();
  }

  loadProducts(): void {
    this._spinner.show();
    this._commonService.getDocuments(PRODUCT_LIST_COLLECTION_NAME).subscribe((res: Product[]) => {
      this._spinner.hide();
      this.productList = res || [];
      this.filteredProductList = [...this.productList];
    });
  }

  initAddProductForm(): void {
    this.addProductFrom = this._formBuilder.group({
      productName: ['', Validators.required],
      productQty: ['', Validators.required],
      productPrice: ['', Validators.required],
      HSNCode: [''],
      batchNumber: [''],
      freeGoods: [''],
      expiryDate: [null],
    });
  }

  onProductInput(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredProductList = this.productList.filter(p =>
      p.name.toLowerCase().includes(value)
    );
    this.showSuggestions = this.filteredProductList.length > 0 && value !== '';
  }

  selectProduct(product: Product) {
    this.addProductFrom.get('productName')?.setValue(product.name);
    this.addProductFrom.get('HSNCode')?.setValue(Number(product.HSNCode));
    this.showSuggestions = false;
  }
}
