import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutBuilderRoutingModule } from './layout-builder-routing.module';
import { BuildFormComponent } from './build-form/build-form.component';


@NgModule({
  declarations: [
    BuildFormComponent
  ],
  imports: [
    CommonModule,
    LayoutBuilderRoutingModule
  ]
})
export class LayoutBuilderModule { }
