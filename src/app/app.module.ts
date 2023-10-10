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
import {HeadComponent} from "./head/head.component";
import {ProgramComponent} from "./program/program.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {DialogContentComponent} from "./program/dialog-content/dialog-content.component";
import {NavBarComponent} from "./nav-bar/nav-bar.component";
import {SliderComponent} from "./slider/slider.component";
import {CircularSliderComponent} from "./slider/circular-slider/circular-slider.component";
import {MotorCurrentService} from "./shared/motor-current.mock.service";

import {VoiceAssistantNavComponent} from "./voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantChatComponent} from "./voice-assistant-chat/voice-assistant-chat.component";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality/voice-assistant-personality.component";
import {FormsModule} from "@angular/forms";
import {VoiceAssistantSidebarRightComponent} from "./voice-assistant-sidebar-right/voice-assistant-sidebar-right.component";

import {VerticalSliderComponent} from "./vertical-slider/vertical-slider.component";
import {MultiSliderComponent} from "./multi-slider/multi-slider.component";
import {BoolToOnOffPipe} from "./shared/pipes/bool-to-on-off-pipe.pipe";

@NgModule({
    declarations: [
        AppComponent,
        MotorControlComponent,
        HandComponent,
        CameraComponent,
        ArmComponent,
        HeadComponent,
        ProgramComponent,
        DialogContentComponent,
        NavBarComponent,
        SliderComponent,
        CircularSliderComponent,
        VoiceAssistantNavComponent,
        VoiceAssistantChatComponent,
        VoiceAssistantPersonalityComponent,
        VoiceAssistantSidebarRightComponent,
        VerticalSliderComponent,
        MultiSliderComponent,
        BoolToOnOffPipe,
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
        FormsModule,
    ],
    providers: [MotorCurrentService],
    bootstrap: [AppComponent],
    entryComponents: [MatDialogModule],
})
export class AppModule {}
