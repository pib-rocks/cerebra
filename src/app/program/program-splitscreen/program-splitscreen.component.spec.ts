import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramSplitscreenComponent} from "./program-splitscreen.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {AngularSplitModule} from "angular-split";
import {RouterModule} from "@angular/router";
import {ProgramService} from "src/app/shared/services/program.service";

describe("ProgramSplitscreenComponent", () => {
    let component: ProgramSplitscreenComponent;
    let fixture: ComponentFixture<ProgramSplitscreenComponent>;
    let programService: ProgramService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProgramSplitscreenComponent],
            imports: [
                HttpClientTestingModule,
                AngularSplitModule,
                RouterModule,
            ],
        }).compileComponents();
        programService = TestBed.inject(ProgramService);
        fixture = TestBed.createComponent(ProgramSplitscreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should subscribe to view mode when the component is instantiated", () => {
        const viewModeSpy = spyOn(
            programService.viewModeSubject,
            "subscribe",
        ).and.callThrough();
        component.ngOnInit();
        expect(viewModeSpy).toHaveBeenCalled();
    });

    it("should subscribe to pythoncode when the component is instantiated", () => {
        const pythoncodeSpy = spyOn(
            programService.pythonCodeSubject,
            "subscribe",
        );
        component.ngOnInit();
        expect(pythoncodeSpy).toHaveBeenCalled();
    });
});
