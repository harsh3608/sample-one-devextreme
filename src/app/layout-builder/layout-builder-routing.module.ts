import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildFormComponent } from './build-form/build-form.component';

const routes: Routes = [
  {
    path: 'build-form',
    component: BuildFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutBuilderRoutingModule { }
