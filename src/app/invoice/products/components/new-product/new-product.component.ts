import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Product } from '../../models/product.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { PRODUCT_LIST_COLLECTION_NAME } from 'src/app/invoice/common/constants/constant';
import { CommonService } from 'src/app/invoice/common/services/common.service';
import { ButtonDirective, FormControlDirective, InputGroupComponent, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-new-product',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent, InputGroupTextDirective, FormControlDirective,
    ModalModule,
    CommonModule
  ],
  templateUrl: './new-product.component.html',
  styleUrl: './new-product.component.scss',
})
export class NewProductComponent {
  productForm!: FormGroup;
  isFormSubmitted: boolean = false;
  @Input() product?: Product;
  @Output() saved = new EventEmitter<Product>();
  @Output() closed = new EventEmitter<void>();

  private _toastrService = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _formBuilder = inject(FormBuilder);
  private _spinner = inject(NgxSpinnerService);



  initProductForm(): void {
    this.productForm = this._formBuilder.group({
      productName: ['', Validators.required],
      price: ['', Validators.required],
      hsnCode: [''],
      firestoreId: [''],
    });
  }
  ngOnInit(): void {
    this.initProductForm();
    if (this.product) {
      this.productForm.patchValue({
        productName: this.product.productName,
        price: this.product.price,
        hsnCode: this.product.hsnCode,
        firestoreId: this.product.firestoreId,
      });
    }
  }

  save() {
    this.isFormSubmitted = true;
    if (this.productForm.invalid) {
      this._toastrService.error('Please fix errors before saving.');
      return;
    }

    this._spinner.show();
    const productDetails: Product = this.productForm.value;
    if (productDetails.firestoreId) {
      this.editProduct(productDetails);
    } else {
      this.addProduct(productDetails);
    }
  }

  clear() {
    this.productForm.reset();
  }

  close() {
    this.closed.emit();
  }


  addProduct(productDetails: Product) {
    this._commonService.addDoc(PRODUCT_LIST_COLLECTION_NAME, productDetails)
      .then(() => {
        this._spinner.hide();
        this.saved.emit(productDetails);
        this._toastrService.success('Product added successfully');
      })
      .catch((err: any) => {
        this._spinner.hide();
        console.error(err);
        this._toastrService.error('Failed to add Product');
      });
  }

  editProduct(productDetails: Product) {
    if (!productDetails.firestoreId) return;

    this._commonService.editDoc(PRODUCT_LIST_COLLECTION_NAME, productDetails.firestoreId, {
      productName: productDetails.productName,
      price: productDetails.price,
      hsnCode: productDetails.hsnCode,
    });
    this._spinner.hide();
    this.saved.emit(productDetails);
    this._toastrService.success('Product updated successfully');
  }
}
