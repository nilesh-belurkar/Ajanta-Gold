import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGstBillComponent } from './new-gst-bill.component';

describe('NewGstBillComponent', () => {
  let component: NewGstBillComponent;
  let fixture: ComponentFixture<NewGstBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGstBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGstBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
