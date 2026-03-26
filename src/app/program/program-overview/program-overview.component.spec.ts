import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramOverviewComponent} from "./program-overview.component";

describe("ProgramOverviewComponent", () => {
    let component: ProgramOverviewComponent;
    let fixture: ComponentFixture<ProgramOverviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProgramOverviewComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
