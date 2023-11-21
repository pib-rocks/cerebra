import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {CameraComponent} from "./camera/camera.component";
import {HandComponent} from "./hand/hand.component";
import {ArmComponent} from "./arm/arm.component";
import {HeadComponent} from "./head/head.component";
import {ProgramComponent} from "./program/program.component";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant/voice-assistant-personality/voice-assistant-personality.component";
import {VoiceAssistantChatComponent} from "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component";
import {sideGuard} from "./security/side-guard";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {PersonalityDescriptionComponent} from "./voice-assistant/voice-assistant-personality/personality-description/personality-description.component";
import {voiceAssistantResolver} from "./voice-assistant/voice-assistant-resolver/voice-assistant.resolver";
import {ChatWindowComponent} from "./voice-assistant/voice-assistant-chat/chat-window/chat-window.component";
import {chatResolver} from "./voice-assistant/voice-assistant-resolver/chat.resolver";
import {personalityGuard} from "./security/personality-guard";

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
    {path: "program", component: ProgramComponent},
    {
        path: "voice-assistant",
        component: VoiceAssistantComponent,
        children: [
            {
                path: "personality",
                component: VoiceAssistantPersonalityComponent,
                children: [
                    {
                        path: ":uuid",
                        component: PersonalityDescriptionComponent,
                        resolve: {personality: voiceAssistantResolver},
                    },
                ],
            },
            {
                path: "chat",
                component: VoiceAssistantChatComponent,
                canActivate: [personalityGuard],
                children: [
                    {
                        path: ":uuid",
                        component: ChatWindowComponent,
                        resolve: {chat: chatResolver},
                    },
                ],
            },
        ],
    },
    {path: "**", redirectTo: "head"},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
