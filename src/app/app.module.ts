import {ErrorHandler, NgModule} from "@angular/core";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {HttpClientModule} from "@angular/common/http";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {CameraComponent} from "./camera/camera.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatTooltipModule} from "@angular/material/tooltip";
import {NgbModule, NgbDropdownModule} from "@ng-bootstrap/ng-bootstrap";
import {MatSliderModule} from "@angular/material/slider";
import {ProgramComponent} from "./program/program.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

import {VoiceAssistantNavComponent} from "./voice-assistant/voice-assistant-nav/voice-assistant-nav.component";
import {VoiceAssistantChatComponent} from "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component";
import {SideBarRightComponent} from "./ui-components/sidebar-right/sidebar-right.component";
import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant/personality-description/voice-assistant-personality-sidebar-right/voice-assistant-personality-sidebar-right.component";
import {VerticalSliderComponent} from "./sliders/vertical-slider/vertical-slider.component";
import {BoolToOnOffPipe} from "./shared/pipes/bool-to-on-off-pipe.pipe";
import {HorizontalSliderComponent} from "./sliders/horizontal-slider/horizontal-slider.component";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {PersonalityDescriptionComponent} from "./voice-assistant/personality-description/personality-description.component";
import {ChatWindowComponent} from "./voice-assistant/voice-assistant-chat/chat-window/chat-window.component";
import {ProgramWorkspaceComponent} from "./program/program-splitscreen/program-workspace/program-workspace.component";
import {ProgramSplitscreenComponent} from "./program/program-splitscreen/program-splitscreen.component";
import {AngularSplitModule} from "angular-split";
import {HIGHLIGHT_OPTIONS, HighlightModule} from "ngx-highlightjs";
import {CerebraErrorHandler} from "./global-error-handler/service/cerebra-error-handler.service";
import {PersonalityWrapperComponent} from "./voice-assistant/personality-wrapper/personality-wrapper.component";
import {JointControlComponent} from "./joint-control/joint-control.component";
import {JointControlCoreComponent} from "./joint-control/joint-control-core/joint-control-core.component";
import {MotorSettingsComponent} from "./joint-control/joint-control-core/motor-settings/motor-settings.component";
import {MotorCurrentComponent} from "./joint-control/joint-control-core/motor-current/motor-current.component";
import {MotorPositionComponent} from "./joint-control/joint-control-core/motor-position/motor-position.component";
import {SaveConfirmationComponent} from "./program/save-confirmation/save-confirmation.component";
import {PythonCodeComponent} from "./program/program-splitscreen/python-code/python-code.component";
import {ConsoleComponent} from "./program/program-splitscreen/console/console.component";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {NgOptimizedImage} from "@angular/common";
import {PoseComponent} from "./pose/pose.component";
import {MarkdownModule} from "ngx-markdown";
import {HardwareIdComponent} from "./joint-control/hardware-id/hardware-id.component";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";

@NgModule({
    declarations: [
        AppComponent,
        CameraComponent,
        JointControlComponent,
        JointControlCoreComponent,
        MotorSettingsComponent,
        MotorCurrentComponent,
        MotorPositionComponent,
        ProgramComponent,
        VoiceAssistantNavComponent,
        VoiceAssistantChatComponent,
        SideBarRightComponent,
        VerticalSliderComponent,
        BoolToOnOffPipe,
        HorizontalSliderComponent,
        VoiceAssistantComponent,
        PersonalityDescriptionComponent,
        ChatWindowComponent,
        ProgramWorkspaceComponent,
        ProgramSplitscreenComponent,
        PersonalityWrapperComponent,
        SaveConfirmationComponent,
        PythonCodeComponent,
        ConsoleComponent,
        VoiceAssistantPersonalitySidebarRightComponent,
        PoseComponent,
        SmartConnectComponent,
        HardwareIdComponent,
        RelayControlComponent,
        IpRetrieverComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        HttpClientModule,
        MatDialogModule,
        MatTooltipModule,
        NgbModule,
        MatSliderModule,
        BrowserAnimationsModule,
        NgbDropdownModule,
        FormsModule,
        AngularSplitModule,
        HighlightModule,
        NgOptimizedImage,
        MarkdownModule.forRoot(),
    ],
    providers: [
        {
            provide: HIGHLIGHT_OPTIONS,
            useValue: {
                coreLibraryLoader: () => import("highlight.js/lib/core"),
                languages: {
                    python: () => import("highlight.js/lib/languages/python"),
                },
            },
        },
        {
            provide: ErrorHandler,
            useClass: CerebraErrorHandler,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
