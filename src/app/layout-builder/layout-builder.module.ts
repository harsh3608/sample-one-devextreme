import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutBuilderRoutingModule } from './layout-builder-routing.module';
import { BuildFormComponent } from './build-form/build-form.component';
import { DevExtremeModule, DxButtonGroupModule, DxButtonModule, DxDataGridModule, DxFileUploaderModule, DxTextBoxModule } from 'devextreme-angular';
import { OverlayModule } from '@angular/cdk/overlay';


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
    DxFileUploaderModule,
    DevExtremeModule,
    DxTextBoxModule,
    OverlayModule
  ]
})
export class LayoutBuilderModule { }
