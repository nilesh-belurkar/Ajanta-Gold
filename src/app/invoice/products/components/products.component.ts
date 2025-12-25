import { Component, ComponentRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, take } from 'rxjs';
import { ConfirmationComponent } from '../../common/components/confirmation/confirmation.component';
import { PRODUCT_LIST_COLLECTION_NAME } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
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
import { PaginationUtilService } from '../../common/services/pagination-util.service';
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
  pageSize: number = 0;
  totalItems: number = 0;

  showModal: boolean = false;
  modalTitle: string = 'New Product';
  private modalRef?: ComponentRef<any>;
  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;

  @ViewChild(ConfirmationComponent) confirmModal!: ConfirmationComponent;

  constructor(
    private _commonService: CommonService,
    private _formBuilder: FormBuilder,
    private _spinner: NgxSpinnerService,
    private _paginationService: PaginationUtilService

  ) { }

  ngOnInit(): void {
    this.pageSize = window.innerWidth <= 768 ? 5 : 10;
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
      $key: [null],
      productcustomerName: ['', Validators.required],
      address: ['', Validators.required],
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10)]],
      gstNumber: ['']
    });
  }

  filterProducts(searchTerm: string | null) {
    const term = (searchTerm ?? '').toLowerCase(); // safe null handling
    this.filteredProductList = this.productList.filter(c => c.name.toLowerCase().includes(term));
    this.totalItems = this.filteredProductList.length;
    this.updatePagination();
  }

  loadProducts(): void {
    this._spinner.show();
    this._commonService.getDocuments(PRODUCT_LIST_COLLECTION_NAME).pipe(take(1)).subscribe((res: Product[]) => {
      this._spinner.hide();
      this.productList = res || [];
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

    // Destroy previous modal
    if (this.modalRef) {
      this.modalRef.destroy();
      this.modalRef = undefined;
    }

    this.modalRef = this.modalHost.createComponent(NewProductComponent);

    if (product) {
      this.modalRef.instance.product = product;
      this.modalTitle = 'Edit Product';
    } else {
      this.modalTitle = 'New Product';
    }

    // Return a promise that resolves on save or reject on close
    return new Promise<void>((resolve) => {
      const savedSub = this.modalRef!.instance.saved?.subscribe(() => {
        savedSub?.unsubscribe();
        closedSub?.unsubscribe();
        this.closeModal();
        this.loadProducts();
        resolve();
      });

      const closedSub = this.modalRef!.instance.closed?.subscribe(() => {
        savedSub?.unsubscribe();
        closedSub?.unsubscribe();
        this.closeModal();
        resolve();
      });
    });
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
    this.confirmModal.open(`Are you sure you want delete "${product.name}"?`, 'Delete Confirmation');

    const sub = this.confirmModal.confirmed.subscribe((result) => {
      if (result) {
        this._commonService.deleteDoc(PRODUCT_LIST_COLLECTION_NAME, product.$key);
        this.loadProducts(); // refresh list
      }

      sub.unsubscribe(); // avoid leak
    });
  }

  get visiblePages(): number[] {
    const isMobile = window.innerWidth <= 768;
    const maxPages = isMobile ? 5 : 10;
    return this._paginationService.getVisiblePages(this.currentPage, this.totalPages, maxPages);
  }

   async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const products = JSON.parse(await input.files[0].text());
    const count = await this._commonService.importProducts(products);

    console.log(`${count} products imported successfully`);
  }
}
