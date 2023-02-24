import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SliderComponent } from './slider/slider.component';
import { HandComponent } from './hand/hand.component';
import { CameraComponent } from './camera/camera.component';
import { ArmSliderComponent } from './arm-slider/arm-slider.component';
import { ArmComponent } from './arm/arm.component';

@NgModule({
  declarations: [
    AppComponent,
    SliderComponent,
    HandComponent,
    CameraComponent,
    ArmSliderComponent,
    ArmComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
