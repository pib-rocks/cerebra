import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CameraComponent } from './camera/camera.component';
import { HandComponent } from './hand/hand.component';
import { LeftArmComponent } from './left-arm/left-arm.component';
import { RightArmComponent } from './right-arm/right-arm.component';

const routes: Routes = [
  {path: '', redirectTo: 'hand/left', pathMatch: 'full'},
  {path: 'hand/:side', component: HandComponent, pathMatch: 'full'},
  {path: "arm/left", component: LeftArmComponent},
  {path: "arm/right", component: RightArmComponent},
  {path: 'camera', component: CameraComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
