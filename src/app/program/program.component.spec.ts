import {ComponentFixture, TestBed} from "@angular/core/testing";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {ProgramComponent} from "./program.component";
import {By} from "@angular/platform-browser";

describe("ProgramComponent", () => {
    let component: ProgramComponent;
    let fixture: ComponentFixture<ProgramComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProgramComponent],
            imports: [MatDialogModule],
            providers: [MatDialog],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("expect workspace variable to be initialized after the ngOnInit is called", () => {
        component.ngOnInit();
        expect(component.workspace).toBeDefined();
        expect(component.observer).toBeDefined();
    });

    it("should open dialog when the button has been clicked", () => {
        const spyOpenDialog = spyOn(component, "openDialog").and.callThrough();
        const button = fixture.debugElement.query(By.css("#savebutton"));
        button.nativeElement.click();
        expect(spyOpenDialog).toHaveBeenCalled();
    });
});
