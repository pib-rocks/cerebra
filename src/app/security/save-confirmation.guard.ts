import {Injectable} from "@angular/core";
import {ProgramWorkspaceComponent} from "../program/program-splitscreen/program-workspace/program-workspace.component";
import {SaveConfirmationGuardService} from "../shared/services/save-confirmation-guard.service";
import {SaveConfirmationOptions} from "../shared/types/save-confirmation-options.enum";

@Injectable({
    providedIn: "root",
})
export class SaveConfirmationGuard {
    constructor(
        private saveConfirmationGuardService: SaveConfirmationGuardService,
    ) {}

    async canDeactivate(
        component: ProgramWorkspaceComponent,
    ): Promise<boolean> {
        const title: string = "Save your changes?";
        const msg: string =
            "You have unsaved changes in your program. Do you want to save them before leaving?";
        const denyMsg: string = "Don't Save";
        const confirmationMsg: string = "Save";

        if (!component.saveBtnDisabled) {
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
