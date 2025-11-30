import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalModule } from '@coreui/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation',
  imports: [ModalModule, CommonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  @Input() message: string = 'Are you sure?';
  @Input() title: string = 'Confirmation';

  @Output() confirmed = new EventEmitter<boolean>();

  visible = false;

  open(message?: string, title?: string) {
    if (message) this.message = message;
    if (title) this.title = title;
    this.visible = true;
  }

  close() {
    this.visible = false;
  }

  confirm() {
    this.visible = false;
    this.confirmed.emit(true);
  }

  cancel() {
    this.visible = false;
    this.confirmed.emit(false);
  }
}
