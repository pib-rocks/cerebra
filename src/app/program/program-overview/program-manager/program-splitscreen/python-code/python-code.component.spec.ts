import {ComponentFixture, TestBed} from "@angular/core/testing";
import {PythonCodeComponent} from "./python-code.component";
import {HighlightModule, HIGHLIGHT_OPTIONS} from "ngx-highlightjs";

describe("PythonCodeComponent", () => {
    let component: PythonCodeComponent;
    let fixture: ComponentFixture<PythonCodeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HighlightModule, PythonCodeComponent],
            providers: [
                {
                    provide: HIGHLIGHT_OPTIONS,
                    useValue: {
                        coreLibraryLoader: () =>
                            import("highlight.js/lib/core"),
                        languages: {
                            python: () =>
                                import("highlight.js/lib/languages/python"),
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PythonCodeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
