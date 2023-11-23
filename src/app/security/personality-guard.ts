import {inject} from "@angular/core";
import {CanActivateFn, Router} from "@angular/router";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";

export const personalityGuard: CanActivateFn = () => {
    const personality = localStorage.getItem("personality");
    if (
        personality &&
        inject(VoiceAssistantService).getPersonality(personality)
    ) {
        return true;
    }
    return inject(Router).navigate(["/voice-assistant/personality"]);
};
