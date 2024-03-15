import {ComponentFixture, TestBed} from "@angular/core/testing";

import {SaveConfirmationComponent} from "./save-confirmation.component";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SaveConfirmationOptions} from "src/app/shared/types/save-confirmation-options.enum";

describe("SaveConfirmationComponent", () => {
    let component: SaveConfirmationComponent;
    let fixture: ComponentFixture<SaveConfirmationComponent>;
    let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

    beforeEach(async () => {
        activeModalSpy = jasmine.createSpyObj("NgbActiveModal", [
            "close",
            "dismiss",
        ]);

        TestBed.configureTestingModule({
            declarations: [SaveConfirmationComponent],
            providers: [{provide: NgbActiveModal, useValue: activeModalSpy}],
        });

        fixture = TestBed.createComponent(SaveConfirmationComponent);
        component = fixture.componentInstance;
    });

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    it("should close the modal with SaveConfirmationOptions.Save on confirm", () => {
        component.confirm();
        expect(activeModalSpy.close).toHaveBeenCalledWith(
            SaveConfirmationOptions.Save,
        );
    });

    it("should close the modal with SaveConfirmationOptions.Deny on deny", () => {
        component.deny();
        expect(activeModalSpy.close).toHaveBeenCalledWith(
            SaveConfirmationOptions.Deny,
        );
    });

    it("should close the modal with SaveConfirmationOptions.Cancel on cancel", () => {
        component.cancel();
        expect(activeModalSpy.dismiss).toHaveBeenCalledWith(
            SaveConfirmationOptions.Cancel,
        );
    });

    it("should have default input values", () => {
        expect(component.title).toBe("Warning");
        expect(component.message).toBe("You have unsaved changes.");
        expect(component.confirmationMsg).toBe("Save");
        expect(component.denyMsg).toBe("Don't Save");
    });
});
