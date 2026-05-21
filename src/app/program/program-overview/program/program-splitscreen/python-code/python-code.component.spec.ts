import {ComponentFixture, TestBed} from "@angular/core/testing";

import {PythonCodeComponent} from "./python-code.component";
import {HighlightModule} from "ngx-highlightjs";

describe("PythonCodeComponent", () => {
    let component: PythonCodeComponent;
    let fixture: ComponentFixture<PythonCodeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PythonCodeComponent],
            imports: [HighlightModule],
        }).compileComponents();

        fixture = TestBed.createComponent(PythonCodeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
