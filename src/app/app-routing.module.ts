import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArmComponent } from './arm/arm.component';
import { HandComponent } from './hand/hand.component';

const routes: Routes = [
  {path: '', component: HandComponent, pathMatch: 'full'},
  {path: "arm", component: ArmComponent},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
