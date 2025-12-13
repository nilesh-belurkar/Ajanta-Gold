import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, inject, NgZone, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../../common/services/common.service';
import { BILL_LIST_COLLECTION_NAME } from '../../../common/constants/constant';
import { Bill } from '../../models/billing.model';
import { convertTimestamps } from '../../../common/utility';
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { take } from 'rxjs';


@Component({
  selector: 'app-bill-preview',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './bill-preview.component.html',
  styleUrl: './bill-preview.component.scss',
})
export class BillPreviewComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _commonService = inject(CommonService);
  private _ngZone = inject(NgZone);
  billId!: string;
  billDetails!: Bill;
  ngOnInit(): void {
    this.billId = this._route.snapshot.paramMap.get('id') || '';
    this.getBillDetailsById(this.billId);
  }


  ngAfterViewInit(): void {

  }
  getBillDetailsById(billId: string) {
    this._commonService.getDocumentById(BILL_LIST_COLLECTION_NAME, billId).subscribe((bill: Bill) => {
      this.billDetails = bill;
      this.billDetails.billDate = convertTimestamps(this.billDetails.billDate);
    })
  }

  generatePDF() {
    this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
      this.capturePDF();
    });
  }

  private capturePDF() {
    const element = document.getElementById('invoice-wrapper');
    if (!element) return;

    const canvasOptions = {
      scale: 3, // Increase scale to improve resolution
      useCORS: true, // This can help with images loaded from external URLs
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight
    };

    html2canvas(element, canvasOptions).then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg', 1.0); // Use JPEG format and set quality to 1.0

      const pdf = new jspdf({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 148; // A5 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 300, undefined, 'FAST');
      pdf.save(`GST_${this.billDetails.customerInfo.name}_${this.billDetails.billDate}.pdf`);
    });

  }


  // capturePDF() {
  //    window.print();
  // }
}
