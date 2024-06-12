import {ComponentFixture, TestBed} from "@angular/core/testing";

import {SmartConnectComponent} from "./smart-connect.component";

describe("SmartConnectComponent", () => {
    let component: SmartConnectComponent;
    let fixture: ComponentFixture<SmartConnectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SmartConnectComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SmartConnectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
