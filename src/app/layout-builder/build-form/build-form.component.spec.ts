import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildFormComponent } from './build-form.component';

describe('BuildFormComponent', () => {
  let component: BuildFormComponent;
  let fixture: ComponentFixture<BuildFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuildFormComponent]
    });
    fixture = TestBed.createComponent(BuildFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
