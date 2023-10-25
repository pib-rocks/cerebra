import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {CameraComponent} from "./camera/camera.component";
import {HandComponent} from "./hand/hand.component";
import {ArmComponent} from "./arm/arm.component";
import {HeadComponent} from "./head/head.component";
import {ProgramComponent} from "./program/program.component";
import {VoiceAssistantPersonalityComponent} from "./voice-assistant-personality/voice-assistant-personality.component";
import {VoiceAssistantChatComponent} from "./voice-assistant-chat/voice-assistant-chat.component";
import {sideGuard} from "./security/side-guard";
import {motorResolver} from "./security/motor.resolver";

const routes: Routes = [
    {path: "", redirectTo: "head", pathMatch: "full"},
    {
        path: "hand/:side",
        component: HandComponent,
        canActivate: [sideGuard],
        resolve: {Motor: motorResolver},
    },
    {
        path: "arm/:side",
        component: ArmComponent,
        canActivate: [sideGuard],
        resolve: {Motor: motorResolver},
    },
    {path: "camera", component: CameraComponent},
    {path: "head", component: HeadComponent, resolve: {Motor: motorResolver}},
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
