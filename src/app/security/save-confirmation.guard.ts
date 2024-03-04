import {Injectable} from "@angular/core";
import {ProgramWorkspaceComponent} from "../program/program-splitscreen/program-workspace/program-workspace.component";
import {SaveConfirmationGuardService} from "../shared/services/save-confirmation-guard.service";

@Injectable({
    providedIn: "root",
})
export class SaveConfirmationGuard {
    constructor(
        private saveConfirmationGuardService: SaveConfirmationGuardService,
    ) {}

    async canDeactivate(
        component: ProgramWorkspaceComponent,
    ): Promise<boolean | Promise<boolean>> {
        const title: string = "Save your changes?";
        const msg: string = "You have unsaved changes in your program.";
        const cancelMsg: string = "Don't Save";
        const confirmationMsg: string = "Save";

        if (!component.saveBtnDisabled) {
            const confirmationResult =
                await this.saveConfirmationGuardService.openConfirmationModal(
                    title,
                    msg,
                    confirmationMsg,
                    cancelMsg,
                );

            if (confirmationResult) {
                component.saveCode();
            }
        }
        // Returns always true, because user is always allowed to leave the route
        // Modal decides whether user wants to save changes or not before leaving
        return true;
    }
}
