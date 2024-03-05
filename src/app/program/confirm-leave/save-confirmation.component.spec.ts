import {ComponentFixture, TestBed} from "@angular/core/testing";

import {SaveConfirmationComponent} from "./save-confirmation.component";

describe("ConfirmLeaveComponent", () => {
    let component: SaveConfirmationComponent;
    let fixture: ComponentFixture<SaveConfirmationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SaveConfirmationComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SaveConfirmationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
