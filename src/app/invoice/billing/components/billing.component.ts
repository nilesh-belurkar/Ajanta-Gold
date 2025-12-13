import { Component, ComponentRef, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, take } from 'rxjs';
import { ConfirmationComponent } from '../../common/components/confirmation/confirmation.component';
import { BILL_LIST_COLLECTION_NAME } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
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
import { Bill, Product } from '../models/billing.model';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';

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
    BsDatepickerModule
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent {
  billingList: Bill[] = [];
  filteredBillingList: Bill[] = [];
  paginatedBillingList: Bill[] = [];
  billingForm!: FormGroup;
  isFormSubmitted: boolean = false;
  searchTerm = new FormControl('');
  currentPage: number = 1;
  pageSize: number = 0;
  totalItems: number = 0;
  currentYear = new Date().getFullYear();

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


  bsConfig: Partial<BsDatepickerConfig> = {
    dateInputFormat: 'YYYY',
    minMode: 'year'
  };

  constructor(
    private _commonService: CommonService,
    private _formBuilder: FormBuilder,
    private _spinner: NgxSpinnerService,
    private _paginationService: PaginationUtilService,
  ) { }

  ngOnInit(): void {
    this.pageSize = window.innerWidth <= 768 ? 5 : 10;
    this.initBillingForm();
    this.loadBillings(this.currentYear);
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

  loadBillings(year: number): void {
    this._spinner.show();
    this._commonService.getDocuments(BILL_LIST_COLLECTION_NAME, this.currentYear).pipe(take(1)).subscribe((res: any[]) => {
      this._spinner.hide();
      this.billingList = res || [];
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


  openNewBillingModal(existingBill?: Bill) {
    this.showModal = true;
    this.modalHost.clear();

    // Destroy previous modal
    if (this.modalRef) {
      this.modalRef.destroy();
      this.modalRef = undefined;
    }

    this.modalRef = this.modalHost.createComponent(NewGstBillComponent);

    if (existingBill) {
      this.modalRef.instance.existingBill = existingBill;
      this.modalTitle = 'Edit Bill';
    } else {
      this.modalTitle = 'New Bill';
    }

    // Return a promise that resolves on save or reject on close
    return new Promise<void>((resolve) => {
      const savedSub = this.modalRef!.instance.saved?.subscribe(() => {
        savedSub?.unsubscribe();
        closedSub?.unsubscribe();
        this.closeModal();
        this.loadBillings(this.currentYear);
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
          this.loadBillings(this.currentYear)
          this._spinner.hide();
        }, error => {
          this._spinner.hide()
          this._toastrService.error('Error deleting billing: ' + error);
        });
      }

      sub.unsubscribe();
    });
  }

  get visiblePages(): number[] {
    const isMobile = window.innerWidth <= 768;
    const maxPages = isMobile ? 5 : 10;
    return this._paginationService.getVisiblePages(this.currentPage, this.totalPages, maxPages);
  }

  onProductDetails(bill: Bill) {

    this.showProductDetailsModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHostOrderDetails.createComponent(OrderDetailsComponent);

    // Column priority
    const columnOrder: string[] = ['productName', 'productPrice', 'productQty'];

    // Hidden columns
    const hiddenColumns = ['HSNCode', 'batchNumber', 'expiryDate', 'freeGoods', '$key'];

    // SAFETY: products must be an array and have at least 1 item
    if (!bill.products || bill.products.length === 0) {
      console.error("No product details available.");
      return;
    }

    // Extract keys from FIRST product
    const keys = Object.keys(bill.products[0]).filter(key => !hiddenColumns.includes(key));

    // Sort based on priority
    const sortedKeys = [
      ...columnOrder.filter(col => keys.includes(col)),
      ...keys.filter(col => !columnOrder.includes(col))
    ];

    // Format headers
    const columns = sortedKeys.map(key => ({
      key,
      label: this.formatHeader(key),
    }));

    // Assign actual product rows
    this.modalRef.instance.columns = columns;
    this.modalRef.instance.rows = bill.products;  // ← FIXED

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


  onYearChange(selectedDate: Date) {
    if (!selectedDate) return;
    this.currentYear = selectedDate.getFullYear();
    this.loadBillings(this.currentYear);
  }

}
