import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {CameraComponent} from "./camera/camera.component";
import {VoiceAssistantChatComponent} from "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component";
import {jointGuard} from "./security/joint-guard";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {PersonalityDescriptionComponent} from "./voice-assistant/personality-description/personality-description.component";
import {voiceAssistantResolver} from "./voice-assistant/voice-assistant-resolver/voice-assistant.resolver";
import {ChatWindowComponent} from "./voice-assistant/voice-assistant-chat/chat-window/chat-window.component";
import {chatResolver} from "./voice-assistant/voice-assistant-resolver/chat.resolver";
import {PersonalityWrapperComponent} from "./voice-assistant/personality-wrapper/personality-wrapper.component";
import {JointControlComponent} from "./joint-control/joint-control.component";
import {JointControlCoreComponent} from "./joint-control/joint-control-core/joint-control-core.component";
import {ProgramComponent} from "./program/program.component";
import {jointResolver} from "./joint-control/joint-resolver/joint-resolver";
import {MotorPositionComponent} from "./joint-control/joint-control-core/motor-position/motor-position.component";
import {motorResolver} from "./joint-control/joint-control-core/motor-position/motor-resolver/motor.resolver";
import {motorGuard} from "./security/motor-guard";
import {SaveConfirmationGuard} from "./security/save-confirmation.guard";
import {ProgramSplitscreenComponent} from "./program/program-splitscreen/program-splitscreen.component";
import {programCodeResolver} from "./program/program-splitscreen/resolver/program-code.resolver";

const routes: Routes = [
    {
        path: "joint-control",
        component: JointControlComponent,
        children: [
            {
                path: ":joint-name",
                component: JointControlCoreComponent,
                resolve: {joint: jointResolver},
                canActivate: [jointGuard],
                children: [
                    {
                        path: "motor/:motor-name",
                        component: MotorPositionComponent,
                        resolve: {motor: motorResolver},
                        canActivate: [motorGuard],
                    },
                ],
            },
        ],
    },
    {
        path: "camera",
        component: CameraComponent,
    },
    {
        path: "voice-assistant",
        component: VoiceAssistantComponent,
        children: [
            {
                path: ":personalityUuid",
                component: PersonalityWrapperComponent,
                children: [
                    {
                        path: "",
                        component: PersonalityDescriptionComponent,
                        resolve: {personality: voiceAssistantResolver},
                    },
                    {
                        path: "chat",
                        component: VoiceAssistantChatComponent,
                        resolve: {personality: voiceAssistantResolver},
                        children: [
                            {
                                path: ":chatUuid",
                                component: ChatWindowComponent,
                                resolve: {chat: chatResolver},
                            },
                            {
                                path: "",
                                component: ChatWindowComponent,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: "program",
        component: ProgramComponent,
        children: [
            {
                path: ":program-number",
                component: ProgramSplitscreenComponent,
                canDeactivate: [SaveConfirmationGuard],
                resolve: {code: programCodeResolver},
            },
        ],
    },
    {path: "", redirectTo: "joint-control/head", pathMatch: "full"},
    {path: "**", redirectTo: "joint-control/head"},
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {paramsInheritanceStrategy: "always"}),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
