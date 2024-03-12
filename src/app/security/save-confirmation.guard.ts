import {Injectable, inject} from "@angular/core";
import {SaveConfirmationGuardService} from "../shared/services/save-confirmation-guard.service";
import {SaveConfirmationOptions} from "../shared/types/save-confirmation-options.enum";
import {ProgramSplitscreenComponent} from "../program/program-splitscreen/program-splitscreen.component";
import {ProgramService} from "../shared/services/program.service";

@Injectable({
    providedIn: "root",
})
export class SaveConfirmationGuard {
    constructor(
        private saveConfirmationGuardService: SaveConfirmationGuardService,
        private programService: ProgramService,
    ) {}

    async canDeactivate(
        component: ProgramSplitscreenComponent,
    ): Promise<boolean> {
        const title: string = "Save your changes?";
        const msg: string =
            "You have unsaved changes in your program. Do you want to save them before leaving?";
        const denyMsg: string = "Don't Save";
        const confirmationMsg: string = "Save";

        if (
            component.codeVisualNew !== component.codeVisualOld &&
            this.programService.getProgramFromCache(component.programNumber)
        ) {
            const confirmationResult =
                await this.saveConfirmationGuardService.openConfirmationModal(
                    title,
                    msg,
                    confirmationMsg,
                    denyMsg,
                );
            if (confirmationResult === SaveConfirmationOptions.Cancel) {
                return false;
            }

            if (confirmationResult === SaveConfirmationOptions.Save) {
                component.saveCode();
            }
        }
        return true;
    }
}
