import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutBuilderRoutingModule } from './layout-builder-routing.module';
import { BuildFormComponent } from './build-form/build-form.component';
import { DxButtonGroupModule, DxButtonModule, DxDataGridModule, DxFileUploaderModule } from 'devextreme-angular';


@NgModule({
  declarations: [
    BuildFormComponent
  ],
  imports: [
    CommonModule,
    LayoutBuilderRoutingModule,
    DxButtonModule,
    DxDataGridModule,
    DxButtonGroupModule,
    DxFileUploaderModule
  ]
})
export class LayoutBuilderModule { }
