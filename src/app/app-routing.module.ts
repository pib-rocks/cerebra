import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {CameraComponent} from "./camera/camera.component";
import {HandComponent} from "./joint-control/hand/hand.component";
import {ArmComponent} from "./joint-control/arm/arm.component";
import {HeadComponent} from "./joint-control/head/head.component";
import {ProgramComponent} from "./program/program.component";
import {VoiceAssistantChatComponent} from "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component";
import {sideGuard} from "./security/side-guard";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {PersonalityDescriptionComponent} from "./voice-assistant/personality-description/personality-description.component";
import {voiceAssistantResolver} from "./voice-assistant/voice-assistant-resolver/voice-assistant.resolver";
import {ChatWindowComponent} from "./voice-assistant/voice-assistant-chat/chat-window/chat-window.component";
import {ProgramWorkspaceComponent} from "./program/program-workspace/program-workspace.component";
import {chatResolver} from "./voice-assistant/voice-assistant-resolver/chat.resolver";
import {PersonalityWrapperComponent} from "./voice-assistant/personality-wrapper/personality-wrapper.component";

const routes: Routes = [
    {path: "", redirectTo: "head", pathMatch: "full"},
    {
        path: "hand/:side",
        component: HandComponent,
        canActivate: [sideGuard],
    },
    {
        path: "arm/:side",
        component: ArmComponent,
        canActivate: [sideGuard],
    },
    {path: "camera", component: CameraComponent},
    {path: "head", component: HeadComponent},
    {
        path: "program",
        component: ProgramComponent,
        children: [
            {
                path: ":uuid",
                component: ProgramWorkspaceComponent,
            },
        ],
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
    {path: "**", redirectTo: "head"},
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {paramsInheritanceStrategy: "always"}),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
