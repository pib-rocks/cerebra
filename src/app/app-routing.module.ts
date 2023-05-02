import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CameraComponent } from "./camera/camera.component";
import { HandComponent } from "./hand/hand.component";
import { ArmComponent } from "./arm/arm.component";
import { VoiceAssistantComponent } from "./voice-assistant/voice-assistant.component";
import { HeadComponent } from "./head/head.component";
import { ProgramComponent } from "./program/program.component";

const routes: Routes = [
  { path: "", redirectTo: "head", pathMatch: "full" },
  { path: "hand/:side", component: HandComponent, pathMatch: "full" },
  { path: "arm/:side", component: ArmComponent },
  { path: "camera", component: CameraComponent },
  { path: "voice", component: VoiceAssistantComponent },
  { path: "head", component: HeadComponent },
  { path: "program", component: ProgramComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
