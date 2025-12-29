import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../../../common/services/common.service';
import { CommonModule } from '@angular/common';
import { ButtonDirective, FormControlDirective, InputGroupComponent, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { PRODUCT_LIST_COLLECTION_NAME } from '../../../../common/constants/constant';
import { formatCalenderDate } from '../../../../common/utility';
import { Product } from '../../../models/billing.model';

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

  @Output() saved = new EventEmitter<Product>();
  @Output() closed = new EventEmitter<void>();
  private _toastrService = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _formBuilder = inject(FormBuilder);
  private _spinner = inject(NgxSpinnerService);
  @Input() existingProduct?: Product;


  save() {
    this.isFormSubmitted = true;
    if (this.addProductFrom.valid) {
      this.addProductFrom.value.expiryDate = formatCalenderDate(this.addProductFrom.value.expiryDate)
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

    if (this.existingProduct) {
      this.addProductFrom.patchValue({
        name: this.existingProduct.name,
        productQty: this.existingProduct.productQty,
        productPrice: this.existingProduct.productPrice,
        HSNCode: this.existingProduct.HSNCode,
        batchNumber: this.existingProduct.batchNumber,
        freeGoods: this.existingProduct.freeGoods,
        expiryDate: this.existingProduct.expiryDate,
        SGST: this.existingProduct.SGST,
        CGST: this.existingProduct.CGST
      });
    }
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
      $key: [''],
      name: ['', Validators.required],
      productQty: ['', Validators.required],
      productPrice: ['', Validators.required],
      HSNCode: [''],
      batchNumber: [''],
      freeGoods: [''],
      expiryDate: [null],
      SGST: ['', Validators.required],
      CGST:['', Validators.required],
    });
  }

  onProductInput(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredProductList = this.productList.filter((p:any) =>
      p.name.toLowerCase().includes(value)
    );
    this.showSuggestions = this.filteredProductList.length > 0 && value !== '';
  }

  selectProduct(product: Product) {
    this.addProductFrom.get('name')?.setValue(product.name);
    this.addProductFrom.get('HSNCode')?.setValue(Number(product.HSNCode));
    this.addProductFrom.get('$key')?.setValue(product.$key);
    this.addProductFrom.get('CGST')?.setValue(product.CGST);
    this.addProductFrom.get('SGST')?.setValue(product.SGST);
    this.showSuggestions = false;
  }
}
