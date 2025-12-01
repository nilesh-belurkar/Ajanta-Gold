import { Component, ComponentRef, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime } from 'rxjs';
import { ORDER_LIST } from '../../common/constants/constant';
import { CommonService } from '../../common/services/common.service';
import { ButtonDirective, DropdownModule, FormControlDirective, InputGroupComponent, InputGroupTextDirective, ModalModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { CommonModule } from '@angular/common';
import { OrderDetailsComponent } from '../components/order-details/order-details.component';
import { Order } from '../models/order.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-orders',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    IconModule,
    InputGroupComponent,
    InputGroupTextDirective,
    ModalModule,
    FormControlDirective,
    DropdownModule,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  orderList: any[] = [];
  filteredOrderList: any[] = [];
  paginatedOrderList: any[] = [];
  isFormSubmitted: boolean = false;
  searchTerm = new FormControl('');
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  selectedStatus: string = 'Pending';

  showModal: boolean = false;
  private modalRef?: ComponentRef<any>;
  @ViewChild('modalHost', { read: ViewContainerRef }) modalHost!: ViewContainerRef;

  orders: Order[] = [];

  private _toastrService = inject(ToastrService);
  private _commonService = inject(CommonService);
  private _spinner = inject(NgxSpinnerService);



  ngOnInit(): void {
    this.loadOrders();
    this.searchCustomer();
  }

  searchCustomer() {
    this.searchTerm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.currentPage = 1;
        this.filterCustomer(value);
      });
  }


  resetSearch() {
    this.searchTerm.setValue('');
  }

  filterCustomer(searchTerm: string | null) {
    const term = (searchTerm ?? '').toLowerCase();
    this.filteredOrderList = this.orderList.filter(c => c.name.toLowerCase().includes(term));
    this.totalItems = this.filteredOrderList.length;
    this.updatePagination();
  }

  loadOrders(): void {
    this._spinner.show();
    this._commonService.getDocuments(ORDER_LIST).subscribe((res: Order[]) => {
      this._spinner.hide();
      this.orderList = res || [];
      this.filteredOrderList = [...this.orderList];
      this.totalItems = this.filteredOrderList.length;
      this.updatePagination();
    });
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrderList = this.filteredOrderList.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }


  closeModal() {
    this.showModal = false;
    this.modalHost.clear();
    this.modalRef = undefined;
  }

  viewOrder(order: any) {
    this.showModal = true;
    this.modalHost.clear();
    this.modalRef = this.modalHost.createComponent(OrderDetailsComponent);
    const columnOrder: string[] = ['name', 'mobile', 'orderDetails', 'status'];
    const hiddenColumns = ['firestoreId', 'createdAt'];


    const keys = Object.keys(order)
      .filter(key => !hiddenColumns.includes(key));

    const sortedKeys = [
      ...columnOrder.filter(x => keys.includes(x)),
      ...keys.filter(x => !columnOrder.includes(x))
    ];

    const columns = sortedKeys.map(key => ({
      key,
      label: this.formatHeader(key)
    }));

    this.modalRef.instance.columns = columns;
    this.modalRef.instance.rows = [order];
    this.modalRef.instance.closed.subscribe(() => this.closeModal());
  }


  private formatHeader(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase());
  }



  async onStatusChange(order: Order, status: string) {
    this._spinner.show();

    try {
      await this._commonService.editDoc(ORDER_LIST, order.firestoreId, { status });
      this._toastrService.success('Status updated');
    } catch (error) {
      this._toastrService.error('Update failed');
      console.error(error);
    } finally {
      this._spinner.hide();
    }
  }

}
