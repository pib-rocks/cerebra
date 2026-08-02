import {SecurityContext} from "@angular/core";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {ReactiveFormsModule} from "@angular/forms";
import {DomSanitizer} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BehaviorSubject, of, Subject} from "rxjs";

import {MarimoComponent} from "./marimo.component";
import {MarimoService} from "./marimo.service";
import {MarimoWorkbook} from "../../shared/types/marimo-workbook";

describe("MarimoComponent", () => {
    let component: MarimoComponent;
    let fixture: ComponentFixture<MarimoComponent>;
    let marimoServiceSpy: jasmine.SpyObj<MarimoService>;
    let modalServiceSpy: jasmine.SpyObj<NgbModal>;
    let routerEvents: Subject<any>;

    const setup = () => {
        marimoServiceSpy = jasmine.createSpyObj(
            "MarimoService",
            ["getNotebooks", "createNotebook", "renameNotebook", "deleteNotebook"],
            {
                notebooksSubject: new BehaviorSubject<any[]>([]),
            },
        );
        // 'notebooks' must be a writable field (not a createSpyObj read-only prop)
        // so individual tests can control the remaining-notebooks state.
        (marimoServiceSpy as any).notebooks = [];
        marimoServiceSpy.getNotebooks.and.returnValue(of({notebooks: []}));
        marimoServiceSpy.deleteNotebook.and.returnValue(of({}));

        modalServiceSpy = jasmine.createSpyObj("NgbModal", ["open"]);
        routerEvents = new Subject<any>();

        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, MarimoComponent],
            providers: [
                {provide: MarimoService, useValue: marimoServiceSpy},
                {provide: NgbModal, useValue: modalServiceSpy},
                {provide: Router, useValue: {events: routerEvents}},
                {
                    provide: ActivatedRoute,
                    useValue: {firstChild: null},
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MarimoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    beforeEach(() => setup());

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should set the iframe to the default notebook on init", () => {
        expect(component.marimoUrl).toBeTruthy();
        expect(component.selectedFilename).toBe(component.defaultFilename);
    });

    describe("deleteWorkbook", () => {
        beforeEach(() => {
            spyOn(window, "confirm").and.returnValue(true);
        });

        it("re-selects the first remaining notebook when the OPEN notebook is deleted and others remain", () => {
            const openFile = "open.py";
            component.selectedFilename = openFile;
            // Two notebooks remain in the service after the delete resolves.
            (marimoServiceSpy as any).notebooks = [
                new MarimoWorkbook("Keep One", "keep_one.py"),
                new MarimoWorkbook("Keep Two", "keep_two.py"),
            ];
            const selectSpy = spyOn(component, "selectNotebook").and.callThrough();

            component.deleteWorkbook(openFile);

            expect(marimoServiceSpy.deleteNotebook).toHaveBeenCalledWith(openFile);
            expect(selectSpy).toHaveBeenCalledWith("keep_one.py");
        });

        it("falls back to the default notebook when the LAST notebook is deleted", () => {
            const openFile = "last.py";
            component.selectedFilename = openFile;
            // No notebooks remain after the delete.
            (marimoServiceSpy as any).notebooks = [];
            const setUrlSpy = spyOn(component, "setIframeUrl").and.callThrough();

            component.deleteWorkbook(openFile);

            expect(marimoServiceSpy.deleteNotebook).toHaveBeenCalledWith(openFile);
            expect(setUrlSpy).toHaveBeenCalledWith(component.defaultFilename);
        });

        it("does not re-select when a NON-open notebook is deleted", () => {
            component.selectedFilename = "current.py";
            (marimoServiceSpy as any).notebooks = [
                new MarimoWorkbook("Current", "current.py"),
            ];
            const selectSpy = spyOn(component, "selectNotebook");
            const setUrlSpy = spyOn(component, "setIframeUrl");

            component.deleteWorkbook("other.py");

            expect(marimoServiceSpy.deleteNotebook).toHaveBeenCalledWith("other.py");
            expect(selectSpy).not.toHaveBeenCalled();
            expect(setUrlSpy).not.toHaveBeenCalled();
        });

        it("does nothing when the confirm dialog is cancelled", () => {
            (window.confirm as jasmine.Spy).and.returnValue(false);

            component.deleteWorkbook("something.py");

            expect(marimoServiceSpy.deleteNotebook).not.toHaveBeenCalled();
        });
    });

    describe("setIframeUrl", () => {
        const resolvedUrl = () =>
            TestBed.inject(DomSanitizer).sanitize(
                SecurityContext.RESOURCE_URL,
                component.marimoUrl,
            );

        it("points the iframe at the Nginx reverse proxy, not the marimo port", () => {
            component.setIframeUrl("analysis.py");

            expect(resolvedUrl()).toBe("/marimo-server/?file=analysis.py&theme=dark");
        });

        it("coalesces an empty filename to the default notebook", () => {
            component.setIframeUrl("");

            expect(resolvedUrl()).toBe(
                `/marimo-server/?file=${component.defaultFilename}&theme=dark`,
            );
        });
    });
});
