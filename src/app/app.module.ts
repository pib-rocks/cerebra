import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FingerSlidersComponent } from './finger-slider/finger-sliders.component';
import { ArmComponent } from './arm/arm.component';
import { RightArmComponent } from './arm/right-arm/right-arm.component';

@NgModule({
  declarations: [
    AppComponent,
    FingerSlidersComponent,
    ArmComponent,
    RightArmComponent,
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
