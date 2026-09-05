import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {jointGuard} from "./security/joint-guard";
import {voiceAssistantResolver} from "./voice-assistant/voice-assistant-resolver/voice-assistant.resolver";
import {chatResolver} from "./voice-assistant/voice-assistant-resolver/chat.resolver";
import {JointControlComponent} from "./joint-control/joint-control.component";
import {JointControlCoreComponent} from "./joint-control/joint-control-core/joint-control-core.component";
import {jointResolver} from "./joint-control/joint-resolver/joint-resolver";
import {MotorPositionComponent} from "./joint-control/joint-control-core/motor-position/motor-position.component";
import {motorResolver} from "./joint-control/joint-control-core/motor-position/motor-resolver/motor.resolver";
import {motorGuard} from "./security/motor-guard";
import {SaveConfirmationGuard} from "./security/save-confirmation.guard";
import {programCodeResolver} from "./program/program-overview/program-manager/program-splitscreen/resolver/program-code.resolver";

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
        path: "system",
        loadComponent: () =>
            import("./system/system.component").then((m) => m.SystemComponent),
        children: [
            {
                path: "diagnostics",
                loadComponent: () =>
                    import("./system/diagnostics/diagnostics.component").then(
                        (m) => m.DiagnosticsComponent,
                    ),
            },
            {
                path: "docker",
                loadComponent: () =>
                    import("./system/docker/docker.component").then(
                        (m) => m.DockerManagementComponent,
                    ),
            },
            {
                path: "hardware-ids",
                loadComponent: () =>
                    import("./system/hardware-id/hardware-id.component").then(
                        (m) => m.HardwareIdComponent,
                    ),
            },
            {
                path: "microphone-array",
                loadComponent: () =>
                    import(
                        "./system/microphone-array/microphone-array.component"
                    ).then((m) => m.MicrophoneArrayComponent),
            },
            {path: "", redirectTo: "diagnostics", pathMatch: "full"},
        ],
    },
    {
        path: "pose",
        loadComponent: () =>
            import("./pose/pose.component").then((m) => m.PoseComponent),
    },
    {
        path: "camera",
        loadComponent: () =>
            import("./camera/camera.component").then((m) => m.CameraComponent),
    },
    {
        path: "voice-assistant",
        loadComponent: () =>
            import("./voice-assistant/voice-assistant.component").then(
                (m) => m.VoiceAssistantComponent,
            ),
        children: [
            {
                path: ":personalityUuid",
                loadComponent: () =>
                    import(
                        "./voice-assistant/personality-wrapper/personality-wrapper.component"
                    ).then((m) => m.PersonalityWrapperComponent),
                children: [
                    {
                        path: "",
                        loadComponent: () =>
                            import(
                                "./voice-assistant/personality-description/personality-description.component"
                            ).then((m) => m.PersonalityDescriptionComponent),
                        resolve: {personality: voiceAssistantResolver},
                    },
                    {
                        path: "chat",
                        loadComponent: () =>
                            import(
                                "./voice-assistant/voice-assistant-chat/voice-assistant-chat.component"
                            ).then((m) => m.VoiceAssistantChatComponent),
                        resolve: {personality: voiceAssistantResolver},
                        children: [
                            {
                                path: ":chatUuid",
                                loadComponent: () =>
                                    import(
                                        "./voice-assistant/voice-assistant-chat/chat-window-deep-chat/chat-window-deep-chat.component"
                                    ).then(
                                        (m) => m.ChatWindowDeepChatComponent,
                                    ),
                                resolve: {chat: chatResolver},
                            },
                            {
                                path: "",
                                loadComponent: () =>
                                    import(
                                        "./voice-assistant/voice-assistant-chat/chat-window-deep-chat/chat-window-deep-chat.component"
                                    ).then(
                                        (m) => m.ChatWindowDeepChatComponent,
                                    ),
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: "program",
        loadComponent: () =>
            import(
                "./program/program-overview/program-overview.component"
            ).then((m) => m.ProgramOverviewComponent),
        children: [
            {
                path: "marimo",
                loadComponent: () =>
                    import("./program/marimo/marimo.component").then(
                        (m) => m.MarimoComponent,
                    ),
                children: [
                    {
                        path: ":notebook",
                        loadComponent: () =>
                            import("./program/marimo/marimo.component").then(
                                (m) => m.MarimoComponent,
                            ),
                    },
                ],
            },
            {
                path: "rgb-led-button",
                loadComponent: () =>
                    import(
                        "./program/program-overview/rgb-led-button/rgb-led-button.component"
                    ).then((m) => m.RgbLedButtonComponent),
            },
            {
                path: "",
                loadComponent: () =>
                    import(
                        "./program/program-overview/program-manager/program-manager.component"
                    ).then((m) => m.ProgramManagerComponent),
                children: [
                    {
                        path: ":program-number",
                        loadComponent: () =>
                            import(
                                "./program/program-overview/program-manager/program-splitscreen/program-splitscreen.component"
                            ).then((m) => m.ProgramSplitscreenComponent),
                        canDeactivate: [SaveConfirmationGuard],
                        resolve: {code: programCodeResolver},
                    },
                ],
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
