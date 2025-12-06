import { Component, ComponentRef, inject, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, take } from 'rxjs';
import { ConfirmationComponent } from '../../common/components/confirmation/confirmation.component';
import { BILL_LIST_COLLECTION_NAME, PRODUCT_LIST_COLLECTION_NAME } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
import { Product } from '../../products/models/product.model';
import { NewProductComponent } from '../../products/components/new-product/new-product.component';
import {
  ButtonDirective,
  FormControlDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  ModalModule,
} from '@coreui/angular';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';
import { PaginationUtilService } from '../../common/services/pagination-util.service';
import { NewGstBillComponent } from './new-gst-bill/new-gst-bill.component';
import { OrderDetailsComponent } from '../../orders/components/order-details/order-details.component';
import { ToastrService } from 'ngx-toastr';
import { BillPreviewComponent } from './bill-preview/bill-preview.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing',
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
    FormControlDirective,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent {
  billingList: any[] = [];
  filteredBillingList: any[] = [];
  paginatedBillingList: any[] = [];
  billingForm!: FormGroup;
  isFormSubmitted: boolean = false;
  searchTerm = new FormControl('');
  currentPage: number = 1;
  pageSize: number = 0;
  totalItems: number = 0;

  showModal: boolean = false;
  showProductDetailsModal: boolean = false;
  modalTitle: string = 'New Billing';
  printElement!: HTMLElement;
  private modalRef?: ComponentRef<any>;
  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;
  @ViewChild('modalHostOrderDetails', { read: ViewContainerRef }) modalHostOrderDetails!: ViewContainerRef;

  @ViewChild(ConfirmationComponent) confirmModal!: ConfirmationComponent;
  private _toastrService = inject(ToastrService);
  private _router = inject(Router);

  constructor(
    private _commonService: CommonService,
    private _formBuilder: FormBuilder,
    private _spinner: NgxSpinnerService,
    private _paginationService: PaginationUtilService,
  ) { }

  ngOnInit(): void {
    this.pageSize = window.innerWidth <= 768 ? 5 : 10;
    this.initBillingForm();
    this.loadBillings();
    this.searchBilling();
  }

  searchBilling() {
    this.searchTerm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.currentPage = 1;
        this.filterBillings(value);
      });
  }


  resetSearch() {
    this.searchTerm.setValue('');
  }

  initBillingForm(): void {
    this.billingForm = this._formBuilder.group({
      firestoreId: [null],
      billingcustomerName: ['', Validators.required],
      address: ['', Validators.required],
      mobile: ['', [Validators.minLength(10), Validators.maxLength(10)]],
      gstNumber: ['']
    });
  }

  filterBillings(searchTerm: string | null) {
    const term = (searchTerm ?? '').toLowerCase(); // safe null handling
    this.filteredBillingList = this.billingList.filter(c => c.customerName.toLowerCase().includes(term));
    this.totalItems = this.filteredBillingList.length;
    this.updatePagination();
  }

  loadBillings(): void {
    this._spinner.show();
    this._commonService.getDocuments(BILL_LIST_COLLECTION_NAME).subscribe((res: any[]) => {
      this._spinner.hide();
      this.billingList = res || [];
      console.log("🚀 ~ this.billingList:", this.billingList[0]);
      this.filteredBillingList = [...this.billingList];
      this.totalItems = this.filteredBillingList.length;
      this.updatePagination();
    });
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedBillingList = this.filteredBillingList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openNewBillingModal(bill?: any) {
    console.log("🚀 ~ bill:", bill)
    this.showModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHost.createComponent(NewGstBillComponent);

    if (bill) {
      this.modalRef.instance.bill = bill;
      this.modalTitle = 'Edit GST bill';
    } else {
      this.modalTitle = 'New GST bill';
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

  editBilling(bill: any) {
    this.openNewBillingModal(bill);
  }

  async deleteBilling(bill: any) {
    this.confirmModal.open(`Are you sure you want delete "${bill.customerName}"?`, 'Delete Confirmation');
    const sub = this.confirmModal.confirmed.subscribe((result) => {
      this._spinner.show();
      if (result) {
        this._commonService.deleteDoc(BILL_LIST_COLLECTION_NAME, bill.$key).then(() => {
          this._toastrService.success('Billing deleted successfully');
          this._spinner.hide();
          this.loadBillings();
        }, error => {
          this._spinner.hide()
          this._toastrService.error('Error deleting billing: ' + error);
        });
      }

      sub.unsubscribe(); // avoid leak
    });
  }

  get visiblePages(): number[] {
    const isMobile = window.innerWidth <= 768;
    const maxPages = isMobile ? 5 : 10;
    return this._paginationService.getVisiblePages(this.currentPage, this.totalPages, maxPages);
  }

  onProductDetails(billing: any[]) {
    this.showProductDetailsModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHostOrderDetails.createComponent(OrderDetailsComponent);

    // Column priority
    const columnOrder: string[] = ['productName', 'productPrice', 'productQty'];

    // Hidden columns
    const hiddenColumns = ['HSNCode', 'batchNumber', 'expiryDate', 'freeGoods'];

    // Get keys only from first row (consistent structure)
    const keys = Object.keys(billing[0])
      .filter(key => !hiddenColumns.includes(key));

    // Sort based on priority
    const sortedKeys = [
      ...columnOrder.filter(x => keys.includes(x)),
      ...keys.filter(x => !columnOrder.includes(x))
    ];

    // Format column headers
    const columns = sortedKeys.map(key => ({
      key,
      label: this.formatHeader(key)
    }));

    // Assign to modal
    this.modalRef.instance.columns = columns;
    this.modalRef.instance.rows = billing;

    this.modalRef.instance.closed.subscribe(() => this.closeModal());
  }

  private formatHeader(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase());
  }

  closeOrderDetailsModal() {
    this.showProductDetailsModal = false;
    this.modalHostOrderDetails.clear();
    this.modalRef = undefined;
  }

  printBill(bill: any) {
    this._router.navigate(['invoice/view-bill', bill.$key]);
  }

}
