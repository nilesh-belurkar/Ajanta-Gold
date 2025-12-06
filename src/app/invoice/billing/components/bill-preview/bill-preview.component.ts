import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-bill-preview',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './bill-preview.component.html',
  styleUrl: './bill-preview.component.scss',
})
export class BillPreviewComponent {

}
