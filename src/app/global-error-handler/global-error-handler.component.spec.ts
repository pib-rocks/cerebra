import {ComponentFixture, TestBed} from "@angular/core/testing";

import {GlobalErrorHandlerComponent} from "./global-error-handler.component";

describe("GlobalErrorHandlerComponent", () => {
    let component: GlobalErrorHandlerComponent;
    let fixture: ComponentFixture<GlobalErrorHandlerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GlobalErrorHandlerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GlobalErrorHandlerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should handle errors appropriately", () => {
        let error = null;
        const consoleLogSpy = spyOn(console, "log").and.callThrough();
        component.handleError(error);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "An unexpected error has occurred",
        );
        error = new Error("Test error");
        component.handleError(error);
        expect(consoleLogSpy).toHaveBeenCalledWith(error.message);
    });
});
