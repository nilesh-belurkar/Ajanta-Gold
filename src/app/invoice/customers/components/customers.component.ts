import { Component, OnInit, ViewChild, ComponentRef, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CUSTOMER_LIST_COLLECTION_NAME } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
import { NewCustomerComponent } from './new-customer/new-customer.component';

import {
  ButtonDirective,
  FormControlDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  ModalModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { NgxSpinnerService } from 'ngx-spinner';
import { Customer } from '../../billing/models/billing.model';
import { debounceTime, take } from 'rxjs/operators';
import { ConfirmationComponent } from '../../common/components/confirmation/confirmation.component';
import { PaginationUtilService } from '../../common/services/pagination-util.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent,
    InputGroupTextDirective,
    FormControlDirective,
    ModalModule,
    ConfirmationComponent
  ]
})
export class CustomersComponent implements OnInit {
  customerList: Customer[] = [];
  filteredCustomerList: Customer[] = [];
  paginatedCustomerList: Customer[] = [];
  customerForm!: FormGroup;
  isFormSubmitted: boolean = false;
  searchTerm = new FormControl('');
  currentPage: number = 1;
  pageSize: number = 0;
  totalItems: number = 0;

  showModal: boolean = false;
  modalTitle: string = 'New Customer';
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
    this.loadCustomers();
    this.searchCustomers();
  }

  searchCustomers() {
    this.searchTerm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.currentPage = 1;
        this.filterCustomers(value);
      });
  }


  resetSearch() {
    this.searchTerm.setValue('');
  }

  filterCustomers(searchTerm: string | null) {
    const term = (searchTerm ?? '').toLowerCase(); // safe null handling
    this.filteredCustomerList = this.customerList.filter(c => c.name.toLowerCase().includes(term));
    this.totalItems = this.filteredCustomerList.length;
    this.updatePagination();
  }

  loadCustomers(): void {
    this._spinner.show();
    this._commonService.getDocuments(CUSTOMER_LIST_COLLECTION_NAME)
      .pipe(take(1))
      .subscribe((res: Customer[]) => {
        this._spinner.hide();
        this.customerList = res || [];
        this.filteredCustomerList = [...this.customerList];
        this.totalItems = this.filteredCustomerList.length;
        this.updatePagination();
      });
  }


  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedCustomerList = this.filteredCustomerList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }


  openNewCustomerModal(customer?: Customer) {
    this.showModal = true;
    this.modalHost.clear();

    // Destroy previous modal
    if (this.modalRef) {
      this.modalRef.destroy();
      this.modalRef = undefined;
    }

    this.modalRef = this.modalHost.createComponent(NewCustomerComponent);

    if (customer) {
      this.modalRef.instance.customer = customer;
      this.modalTitle = 'Edit Customer';
    } else {
      this.modalTitle = 'New Customer';
    }

    // Return a promise that resolves on save or reject on close
    return new Promise<void>((resolve) => {
      const savedSub = this.modalRef!.instance.saved?.subscribe(() => {
        savedSub?.unsubscribe();
        closedSub?.unsubscribe();
        this.closeModal();
        this.loadCustomers();
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

  editCustomer(customer: Customer) {
    this.openNewCustomerModal(customer);
  }

  async deleteCustomer(customer: Customer) {
    if (!customer.$key) {
      console.error('Cannot delete customer without $key');
      return;
    }

    this.confirmModal.open(`Are you sure you want to delete "${customer.name}"?`, 'Delete Confirmation');

    const sub = this.confirmModal.confirmed.subscribe((result) => {
      if (result) {
        this._commonService.deleteDoc(CUSTOMER_LIST_COLLECTION_NAME, customer.$key);
      }
      this.loadCustomers();
      sub.unsubscribe();
    });
  }



  get visiblePages(): number[] {
    const isMobile = window.innerWidth <= 768;
    const maxPages = isMobile ? 5 : 10;
    return this._paginationService.getVisiblePages(this.currentPage, this.totalPages, maxPages);
  }
}
