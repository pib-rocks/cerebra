import {ComponentFixture, TestBed} from "@angular/core/testing";

import {RelayControlComponent} from "./relay-control.component";

describe("RelayControlComponent", () => {
    let component: RelayControlComponent;
    let fixture: ComponentFixture<RelayControlComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RelayControlComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(RelayControlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
