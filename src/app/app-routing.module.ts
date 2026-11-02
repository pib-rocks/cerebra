import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {jointGuard} from "./security/joint-guard";
import {voiceAssistantResolver} from "./voice-assistant/voice-assistant-resolver/voice-assistant.resolver";
import {chatResolver} from "./voice-assistant/voice-assistant-resolver/chat.resolver";
import {MovementComponent} from "./movement/movement.component";
import {MovementCoreComponent} from "./movement/movement-core/movement-core.component";
import {jointResolver} from "./movement/joint-resolver/joint-resolver";
import {MotorPositionComponent} from "./movement/movement-core/motor-position/motor-position.component";
import {Robot3DComponent} from "./movement/robot-3d/robot-3d.component";
import {motorResolver} from "./movement/movement-core/motor-position/motor-resolver/motor.resolver";
import {motorGuard} from "./security/motor-guard";
import {SaveConfirmationGuard} from "./security/save-confirmation.guard";
import {programCodeResolver} from "./program/program-overview/program-manager/program-splitscreen/resolver/program-code.resolver";

export const routes: Routes = [
    {
        path: "movement",
        component: MovementComponent,
        children: [
            {path: "", redirectTo: "3d", pathMatch: "full"},
            {
                path: "3d",
                component: Robot3DComponent,
            },
            {
                path: "pose",
                loadComponent: () =>
                    import("./movement/pose/pose.component").then(
                        (m) => m.PoseComponent,
                    ),
            },
            {
                path: ":joint-name",
                component: MovementCoreComponent,
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
    {path: "joint-control", redirectTo: "movement", pathMatch: "full"},
    {
        path: "joint-control/3d",
        redirectTo: "movement/3d",
        pathMatch: "full",
    },
    {
        path: "joint-control/pose",
        redirectTo: "movement/pose",
        pathMatch: "full",
    },
    {
        path: "joint-control/:jointName",
        redirectTo: "movement/:jointName",
    },
    {
        path: "joint-control/:jointName/motor/:motorName",
        redirectTo: "movement/:jointName/motor/:motorName",
    },
    {path: "pose", redirectTo: "movement/pose", pathMatch: "full"},
    {
        path: "smart-home",
        loadComponent: () =>
            import("./smart-home/smart-home.component").then(
                (m) => m.SmartHomeComponent,
            ),
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
                path: "update",
                loadComponent: () =>
                    import("./system/update/update.component").then(
                        (m) => m.UpdateComponent,
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
            {
                path: "keys",
                loadComponent: () =>
                    import("./system/keys/keys.component").then(
                        (m) => m.KeysComponent,
                    ),
            },
            {path: "", redirectTo: "diagnostics", pathMatch: "full"},
        ],
    },
    {
        path: "vision",
        loadComponent: () =>
            import("./vision/vision.component").then((m) => m.VisionComponent),
    },
    {path: "camera", redirectTo: "vision", pathMatch: "full"},
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
                        redirectTo: "chat",
                        pathMatch: "full",
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
    {
        path: "display",
        loadComponent: () =>
            import("./system/keys/display-unlock.component").then(
                (m) => m.DisplayUnlockComponent,
            ),
    },
    {path: "", redirectTo: "movement/3d", pathMatch: "full"},
    {path: "**", redirectTo: "movement/3d"},
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {paramsInheritanceStrategy: "always"}),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
