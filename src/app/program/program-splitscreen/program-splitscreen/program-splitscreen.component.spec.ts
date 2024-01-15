import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramSplitscreenComponent} from "./program-splitscreen.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {AngularSplitModule} from "angular-split";
import {RouterModule} from "@angular/router";

describe("ProgramSplitscreenComponent", () => {
    let component: ProgramSplitscreenComponent;
    let fixture: ComponentFixture<ProgramSplitscreenComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProgramSplitscreenComponent],
            imports: [
                HttpClientTestingModule,
                AngularSplitModule,
                RouterModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramSplitscreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
