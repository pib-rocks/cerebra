import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {CameraComponent} from "./camera/camera.component";
import {HandComponent} from "./hand/hand.component";
import {ArmComponent} from "./arm/arm.component";
import {VoiceAssistantComponent} from "./voice-assistant/voice-assistant.component";
import {HeadComponent} from "./head/head.component";
import {ProgramComponent} from "./program/program.component";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality/voice-assistant-personality.component";
import {VoiceAssistantChatComponent} from "./voice-assistant-chat/voice-assistant-chat.component";
import {sideGuard} from "./security/side-guard";

const routes: Routes = [
    {path: "", redirectTo: "head", pathMatch: "full"},
    {
        path: "hand/:side",
        component: HandComponent,
        canActivate: [sideGuard],
    },
    {path: "arm/:side", component: ArmComponent, canActivate: [sideGuard]},
    {path: "camera", component: CameraComponent},
    {path: "voice", component: VoiceAssistantComponent},
    {path: "head", component: HeadComponent},
    {path: "program", component: ProgramComponent},
    {path: "personality", component: VoiceAssistantPersonalityComponent},
    {path: "chat", component: VoiceAssistantChatComponent},
    {path: "**", redirectTo: "head"},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
