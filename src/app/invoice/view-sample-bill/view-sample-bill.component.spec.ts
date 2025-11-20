import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSampleBillComponent } from './view-sample-bill.component';

describe('ViewSampleBillComponent', () => {
  let component: ViewSampleBillComponent;
  let fixture: ComponentFixture<ViewSampleBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewSampleBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSampleBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
