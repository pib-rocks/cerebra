import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CameraComponent } from './camera/camera.component';
import { HandComponent } from './hand/hand.component';
import { ArmComponent } from './arm/arm.component';

const routes: Routes = [
  {path: '', redirectTo: 'hand/left', pathMatch: 'full'},
  {path: 'hand/:side', component: HandComponent, pathMatch: 'full'},
  {path: "arm/:side", component: ArmComponent},
  {path: 'camera', component: CameraComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
