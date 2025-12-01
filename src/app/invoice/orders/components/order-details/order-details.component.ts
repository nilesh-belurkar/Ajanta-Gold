import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonDirective, InputGroupComponent, InputGroupTextDirective, ModalModule, DropdownModule, FormControlDirective, CardComponent, CardBodyComponent, CardHeaderComponent, CardFooterComponent } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

@Component({
  selector: 'app-order-details',
  standalone: true,
  templateUrl: './order-details.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconModule,
    ModalModule,
    DropdownModule,
  ],
})
export class OrderDetailsComponent {
  @Input() columns: any[] = [];
  @Input() rows: any[] = [];

  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
