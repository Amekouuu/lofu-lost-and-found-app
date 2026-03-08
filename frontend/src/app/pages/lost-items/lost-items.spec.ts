import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LostItems } from './lost-items';

describe('LostItems', () => {
  let component: LostItems;
  let fixture: ComponentFixture<LostItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LostItems],
    }).compileComponents();

    fixture = TestBed.createComponent(LostItems);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
