import {NgModule} from "@angular/core";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {HttpClientModule} from "@angular/common/http";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {MotorControlComponent} from "./joint-control/motor-control/motor-control.component";
import {HandComponent} from "./joint-control/hand/hand.component";
import {CameraComponent} from "./camera/camera.component";
import {ArmComponent} from "./joint-control/arm/arm.component";
import {MatDialogModule} from "@angular/material/dialog";
import {NgbModule, NgbDropdownModule} from "@ng-bootstrap/ng-bootstrap";
import {MatSliderModule} from "@angular/material/slider";
import {HeadComponent} from "./joint-control/head/head.component";
import {ProgramComponent} from "./program/program.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NavBarComponent} from "./nav-bar/nav-bar.component";
import {CircularSliderComponent} from "./joint-control/circular-slider/circular-slider.component";
import {MotorCurrentService} from "./shared/services/motor-service/motor-current.service";

import {VoiceAssistantNavComponent} from "./voice-assistant/voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantChatComponent} from "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant/voice-assistant-personality/voice-assistant-personality.component";
import {SideBarRightComponent} from "./ui-components/sidebar-right/sidebar-right.component";

import {VerticalSliderComponent} from "./sliders/vertical-slider/vertical-slider.component";
import {BoolToOnOffPipe} from "./shared/pipes/bool-to-on-off-pipe.pipe";
import {HorizontalSliderComponent} from "./sliders/horizontal-slider/horizontal-slider.component";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {PersonalityDescriptionComponent} from "./voice-assistant/voice-assistant-personality/personality-description/personality-description.component";
import {ChatWindowComponent} from "./voice-assistant/voice-assistant-chat/chat-window/chat-window.component";
import {ProgramWorkspaceComponent} from "./program/program-workspace/program-workspace.component";
import {ProgramSplitscreenComponent} from "./program/program-splitscreen/program-splitscreen/program-splitscreen.component";
import {AngularSplitModule} from "angular-split";
import {HIGHLIGHT_OPTIONS, HighlightModule} from "ngx-highlightjs";

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
        CircularSliderComponent,
        VoiceAssistantNavComponent,
        VoiceAssistantChatComponent,
        VoiceAssistantPersonalityComponent,
        SideBarRightComponent,
        VerticalSliderComponent,
        BoolToOnOffPipe,
        HorizontalSliderComponent,
        VoiceAssistantComponent,
        PersonalityDescriptionComponent,
        ChatWindowComponent,
        ProgramWorkspaceComponent,
        ProgramSplitscreenComponent,
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
        AngularSplitModule,
        HighlightModule,
    ],
    providers: [
        MotorCurrentService,
        {
            provide: HIGHLIGHT_OPTIONS,
            useValue: {
                coreLibraryLoader: () => import("highlight.js/lib/core"),
                languages: {
                    python: () => import("highlight.js/lib/languages/python"),
                },
            },
        },
    ],
    bootstrap: [AppComponent],
    entryComponents: [MatDialogModule],
})
export class AppModule {}
