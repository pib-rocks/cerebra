import {TestBed} from "@angular/core/testing";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SaveConfirmationGuardService} from "./save-confirmation-guard.service";
import {SaveConfirmationComponent} from "src/app/program/save-confirmation/save-confirmation.component";
import {SaveConfirmationOptions} from "../types/save-confirmation-options.enum";

describe("SaveConfirmationGuardService", () => {
    let service: SaveConfirmationGuardService;
    let modalServiceSpy: jasmine.SpyObj<NgbModal>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj("NgbModal", ["open"]);

        TestBed.configureTestingModule({
            providers: [
                SaveConfirmationGuardService,
                {provide: NgbModal, useValue: spy},
            ],
        });
        service = TestBed.inject(SaveConfirmationGuardService);
        modalServiceSpy = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should open confirmation modal and return Save option", async () => {
        const modalResult = SaveConfirmationOptions.Save;
        modalServiceSpy.open.and.returnValue({
            result: Promise.resolve(modalResult),
            componentInstance: {},
        } as any);

        const result = await service.openConfirmationModal("", "", "", "");

        expect(modalServiceSpy.open).toHaveBeenCalledWith(
            SaveConfirmationComponent,
            jasmine.any(Object),
        );
        expect(result).toBe(modalResult);
    });

    it("should handle modal dismissal and return Cancel option", async () => {
        const modalResult = SaveConfirmationOptions.Cancel;
        modalServiceSpy.open.and.returnValue({
            result: Promise.reject(),
            componentInstance: {},
        } as any);

        const result = await service.openConfirmationModal("", "", "", "");

        expect(modalServiceSpy.open).toHaveBeenCalledWith(
            SaveConfirmationComponent,
            jasmine.any(Object),
        );
        expect(result).toBe(modalResult);
    });

    it("should set the correct properties in the confirmation component", async () => {
        const modalResult = SaveConfirmationOptions.Save;
        const title = "Test Title";
        const msg = "test msg";
        const confMsg = "test conf";
        const denyMsg = "test deny";

        modalServiceSpy.open.and.returnValue({
            result: Promise.resolve(modalResult),
            componentInstance: {},
        } as any);

        await service.openConfirmationModal(title, msg, confMsg, denyMsg);

        // Retrieve the opened component instance
        const confirmationComponentInstance =
            modalServiceSpy.open.calls.mostRecent().returnValue
                .componentInstance as SaveConfirmationComponent;

        expect(confirmationComponentInstance.title).toBe(title);
        expect(confirmationComponentInstance.message).toBe(msg);
        expect(confirmationComponentInstance.confirmationMsg).toBe(confMsg);
        expect(confirmationComponentInstance.denyMsg).toBe(denyMsg);
    });
});
