import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramOverviewComponent} from "./program-overview.component";
import {ProgramService} from "src/app/shared/services/program.service";
import {BehaviorSubject, of} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {Program} from "src/app/shared/types/program";

describe("ProgramOverviewComponent", () => {
    let component: ProgramOverviewComponent;
    let fixture: ComponentFixture<ProgramOverviewComponent>;
    let programServiceSpy: jasmine.SpyObj<ProgramService>;
    let programsSubject: BehaviorSubject<Program[]>;

    beforeEach(async () => {
        programsSubject = new BehaviorSubject<Program[]>([]);

        programServiceSpy = jasmine.createSpyObj("ProgramService", [], {
            programsSubject: programsSubject,
        });

        await TestBed.configureTestingModule({
            declarations: [ProgramOverviewComponent],
            imports: [RouterTestingModule],
            providers: [{provide: ProgramService, useValue: programServiceSpy}],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
