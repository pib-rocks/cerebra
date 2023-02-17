import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArmComponent } from './arm/arm.component';
import { FingerSlidersComponent } from './finger-sliders/finger-sliders.component';
import { HandComponent } from './hand/hand.component';
import { CameraComponent } from './camera/camera.component';

@NgModule({
  declarations: [
    AppComponent,
    FingerSlidersComponent,
    HandComponent,
    ArmComponent,
    CameraComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
