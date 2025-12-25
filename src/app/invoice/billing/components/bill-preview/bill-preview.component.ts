import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, inject, NgZone, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../../common/services/common.service';
import { BILL_LIST_COLLECTION_NAME } from '../../../common/constants/constant';
import { Bill } from '../../models/billing.model';
import { convertTimestamps, invoiceWhatsappMessage } from '../../../common/utility';
import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { take } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { NgxSpinnerService } from 'ngx-spinner';


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
  private _functions = inject(Functions);
 private _spinner = inject(NgxSpinnerService);
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

  async capturePDFAndSendOnWhatsapp() {
    this._spinner.show();
    const element = document.getElementById('invoice-wrapper');
    if (!element) {
      console.error('Invoice element not found');
      return;
    }

    // 1️⃣ Render HTML → Canvas
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
    });

    // 2️⃣ Canvas → PDF
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jspdf({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // 3️⃣ PDF → Base64
    const pdfBlob = pdf.output('blob');
    const base64Pdf = await this.blobToBase64(pdfBlob);

    const invoiceNo = this.billDetails.billNumber.toString();
    const mobile = this.billDetails.customerInfo.mobile;
    const name = this.billDetails.customerInfo.name;

    // 4️⃣ Upload to Firebase (GEN-1 HTTP FUNCTION)
    const url = await this.uploadInvoiceToFirebase(base64Pdf, invoiceNo);
    this._spinner.hide();
    // 5️⃣ Open WhatsApp
    this.openWhatsApp(name, mobile, url, invoiceNo);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  openWhatsApp(name: string, mobile: string, url: string, invoiceNo: string) {
    const phone = String(7841868668).replace(/\D/g, '');

    if (phone.length < 10) {
      throw new Error('Invalid mobile number');
    }

    const msg = invoiceWhatsappMessage(name, invoiceNo, url);
    const encoded = encodeURIComponent(msg);

    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank');
  }

  async uploadInvoiceToFirebase(base64Pdf: string, billNumber: string): Promise<string> {
    const response = await fetch(
      'https://us-central1-ajanta-gold.cloudfunctions.net/uploadInvoicePdf',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Pdf,
          invoiceNo: billNumber
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
      this._spinner.hide();
    }

    const data = await response.json();
    return data.url;
  }



  // capturePDF() {
  //    window.print();
  // }
}
