import { Component, ComponentRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, take } from 'rxjs';
import { ConfirmationComponent } from '../../common/components/confirmation/confirmation.component';
import { CUSTOMER_LIST_COLLECTION_NAME, PRODUCT_LIST_COLLECTION_NAME } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
import { NewCustomerComponent } from '../../customers/components/new-customer/new-customer.component';
import { Product } from '../models/product.model';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';
import {
  ButtonDirective,
  FormControlDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  ModalModule,
} from '@coreui/angular';
import { NewProductComponent } from './new-product/new-product.component';
@Component({
  selector: 'app-products',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent,
    InputGroupTextDirective,
    ModalModule,
    ConfirmationComponent,
    FormControlDirective
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  productList: Product[] = [];
  filteredProductList: Product[] = [];
  paginatedProductList: Product[] = [];
  productForm!: FormGroup;
  isFormSubmitted: boolean = false;
  searchTerm = new FormControl('');
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;

  showModal: boolean = false;
  modalTitle: string = 'New Product';
  private modalRef?: ComponentRef<any>;
  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;

  @ViewChild(ConfirmationComponent) confirmModal!: ConfirmationComponent;

  constructor(
    private _commonService: CommonService,
    private _formBuilder: FormBuilder,
    private _spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.initProductForm();
    this.loadProducts();
    this.searchProduct();
  }

  searchProduct() {
    this.searchTerm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.currentPage = 1;
        this.filterProducts(value);
      });
  }


  resetSearch() {
    this.searchTerm.setValue('');
  }

  initProductForm(): void {
    this.productForm = this._formBuilder.group({
      firestoreId: [null],
      productcustomerName: ['', Validators.required],
      address: ['', Validators.required],
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10)]],
      gstNumber: ['']
    });
  }

  filterProducts(searchTerm: string | null) {
    const term = (searchTerm ?? '').toLowerCase(); // safe null handling
    this.filteredProductList = this.productList.filter(c => c.productName.toLowerCase().includes(term));
    this.totalItems = this.filteredProductList.length;
    this.updatePagination();
  }

  loadProducts(): void {
    this._spinner.show();
    this._commonService.getDocuments(PRODUCT_LIST_COLLECTION_NAME).subscribe((res: Product[]) => {
      this._spinner.hide();
      this.productList = res || [];
      console.log("🚀 ~ this.customerList:", this.productList);
      this.filteredProductList = [...this.productList];
      this.totalItems = this.filteredProductList.length;
      this.updatePagination();
    });
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProductList = this.filteredProductList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openNewProductModal(product?: Product) {
    this.showModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHost.createComponent(NewProductComponent);

    if (product) {
      this.modalRef.instance.product = product;
      this.modalTitle = 'Edit product';
    } else {
      this.modalTitle = 'New product';
    }
    this.modalRef.instance.saved?.pipe(take(1)).subscribe(() => {
      this.closeModal();
    });

    this.modalRef.instance.closed?.pipe(take(1)).subscribe(() => this.closeModal());
  }

  closeModal() {
    this.showModal = false;
    this.modalHost.clear();
    this.modalRef = undefined;
  }

  editProduct(product: Product) {
    this.openNewProductModal(product);
  }

  async deleteProduct(product: Product) {
    this.confirmModal.open(`Are you sure you want delete "${product.productName}"?`, 'Delete Confirmation');

    const sub = this.confirmModal.confirmed.subscribe((result) => {
      if (result) {
        this._commonService.deleteDoc(PRODUCT_LIST_COLLECTION_NAME, product.firestoreId);
        this.loadProducts(); // refresh list
      }

      sub.unsubscribe(); // avoid leak
    });
  }
}
