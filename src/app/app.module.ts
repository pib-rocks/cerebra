import {ErrorHandler, NgModule} from "@angular/core";
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
import {NavBarComponent} from "./nav-bar/nav-bar.component";
import {SliderComponent} from "./slider/slider.component";
import {CircularSliderComponent} from "./slider/circular-slider/circular-slider.component";
import {MotorCurrentService} from "./shared/motor-current.service";

import {VoiceAssistantNavComponent} from "./voice-assistant/voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantChatComponent} from "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant/voice-assistant-personality/voice-assistant-personality.component";
import {FormsModule} from "@angular/forms";
import {SideBarRightComponent} from "./ui-components/sidebar-right/sidebar-right.component";

import {VerticalSliderComponent} from "./vertical-slider/vertical-slider.component";
import {MultiSliderComponent} from "./multi-slider/multi-slider.component";
import {BoolToOnOffPipe} from "./shared/pipes/bool-to-on-off-pipe.pipe";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {PersonalityDescriptionComponent} from "./voice-assistant/voice-assistant-personality/personality-description/personality-description.component";
import {ChatWindowComponent} from "./voice-assistant/voice-assistant-chat/chat-window/chat-window.component";
import {ProgramWorkspaceComponent} from "./program/program-workspace/program-workspace.component";
import {CerebraErrorHandler} from "./global-error-handler/service/cerebra-error-handler.service";

@NgModule({
    declarations: [
        AppComponent,
        MotorControlComponent,
        HandComponent,
        CameraComponent,
        ArmComponent,
        HeadComponent,
        ProgramComponent,
        NavBarComponent,
        SliderComponent,
        CircularSliderComponent,
        VoiceAssistantNavComponent,
        VoiceAssistantChatComponent,
        VoiceAssistantPersonalityComponent,
        SideBarRightComponent,
        VerticalSliderComponent,
        MultiSliderComponent,
        BoolToOnOffPipe,
        VoiceAssistantComponent,
        PersonalityDescriptionComponent,
        ChatWindowComponent,
        ProgramWorkspaceComponent,
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
    providers: [
        MotorCurrentService,
        {
            provide: ErrorHandler,
            useClass: CerebraErrorHandler,
        },
    ],
    bootstrap: [AppComponent],
    entryComponents: [MatDialogModule],
})
export class AppModule {}
