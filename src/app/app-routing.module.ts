import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArmComponent } from './arm/arm.component';
import { CameraComponent } from './camera/camera.component';
import { HandComponent } from './hand/hand.component';

const routes: Routes = [
  {path: '', component: HandComponent, pathMatch: 'full'},
  {path: "arm/:side", component: ArmComponent},
  {path: 'camera', component: CameraComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
