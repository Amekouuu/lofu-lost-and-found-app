import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimChat } from './claim-chat';

describe('ClaimChat', () => {
  let component: ClaimChat;
  let fixture: ComponentFixture<ClaimChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimChat],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
