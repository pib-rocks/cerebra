import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ProgramOverviewComponent} from "./program-overview.component";
import {ProgramService} from "src/app/shared/services/program.service";
import {BehaviorSubject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";
import {Router} from "@angular/router";
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
            imports: [RouterTestingModule, ProgramOverviewComponent],
            providers: [{provide: ProgramService, useValue: programServiceSpy}],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should return false for isProgramTabActive when URL contains rgb-led-button or marimo", () => {
        const router = TestBed.inject(Router);
        const urlSpy = spyOnProperty(router, "url", "get");

        urlSpy.and.returnValue("/program/overview");
        expect(component.isProgramTabActive).toBeTrue();

        urlSpy.and.returnValue("/program/rgb-led-button");
        expect(component.isProgramTabActive).toBeFalse();

        urlSpy.and.returnValue("/program/marimo");
        expect(component.isProgramTabActive).toBeFalse();
    });
});
