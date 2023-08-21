import {NgModule} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {HttpClientModule} from "@angular/common/http";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {MotorControlComponent} from "./motor-control/motor-control.component";
import {HandComponent} from "./hand/hand.component";
import {CameraComponent} from "./camera/camera.component";
import {ArmComponent} from "./arm/arm.component";
import {MatDialogModule} from "@angular/material/dialog";
import {NgbModule, NgbDropdownModule} from "@ng-bootstrap/ng-bootstrap";
import {MatSliderModule} from "@angular/material/slider";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {HeadComponent} from "./head/head.component";
import {ProgramComponent} from "./program/program.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {DialogContentComponent} from "./program/dialog-content/dialog-content.component";
import {NavBarComponent} from "./nav-bar/nav-bar.component";
import {SliderComponent} from "./slider/slider.component";
import {VerticalSliderComponent} from "./vertical-slider/vertical-slider.component";

@NgModule({
    declarations: [
        AppComponent,
        MotorControlComponent,
        HandComponent,
        CameraComponent,
        ArmComponent,
        VoiceAssistantComponent,
        HeadComponent,
        ProgramComponent,
        DialogContentComponent,
        NavBarComponent,
        SliderComponent,
        VerticalSliderComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        HttpClientModule,
        MatDialogModule,
        NgbModule,
        MatSliderModule,
        BrowserAnimationsModule,
        NgbDropdownModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
    entryComponents: [MatDialogModule],
})
export class AppModule {}
