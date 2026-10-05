import {ComponentFixture, TestBed} from "@angular/core/testing";
import {AnimatedFaceComponent} from "./animated-face.component";

describe("AnimatedFaceComponent", () => {
    let fixture: ComponentFixture<AnimatedFaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AnimatedFaceComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(AnimatedFaceComponent);
        fixture.detectChanges();
    });

    it("opens the mouth while speaking and marks the three states", () => {
        const face = () =>
            fixture.nativeElement.querySelector(
                "#animated-face",
            ) as HTMLElement;

        expect(face().getAttribute("data-activity")).toBe("idle");
        expect(face().classList.contains("mouth-open")).toBeFalse();

        fixture.componentInstance.activity = "listening";
        fixture.detectChanges();
        expect(face().getAttribute("data-activity")).toBe("listening");

        fixture.componentInstance.activity = "thinking";
        fixture.detectChanges();
        expect(face().getAttribute("data-activity")).toBe("thinking");

        fixture.componentInstance.activity = "speaking";
        fixture.componentInstance.mouthOpen = true;
        fixture.detectChanges();
        expect(face().classList.contains("mouth-open")).toBeTrue();
    });
});
