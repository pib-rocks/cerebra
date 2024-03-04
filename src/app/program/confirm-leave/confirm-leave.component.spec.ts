import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ConfirmLeaveComponent} from "./confirm-leave.component";

describe("ConfirmLeaveComponent", () => {
    let component: ConfirmLeaveComponent;
    let fixture: ComponentFixture<ConfirmLeaveComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmLeaveComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmLeaveComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
