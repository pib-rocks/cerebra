import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FingerSlidersComponent } from './finger-sliders/finger-sliders.component';
import { HandComponent } from './hand/hand.component';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from './shared/CustomRouteReuseStrategy';
import { CameraComponent } from './camera/camera.component';
import { LeftArmComponent } from './left-arm/left-arm.component';
import { RightArmComponent } from './right-arm/right-arm.component';

@NgModule({
  declarations: [
    AppComponent,
    FingerSlidersComponent,
    HandComponent,
    CameraComponent,
    LeftArmComponent,
    RightArmComponent,
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
