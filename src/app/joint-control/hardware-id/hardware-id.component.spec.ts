import {ComponentFixture, TestBed} from "@angular/core/testing";

import {HardwareIdComponent} from "./hardware-id.component";
import {BrickletService} from "src/app/shared/services/bricklet.service";
import {Subject} from "rxjs";
import {Bricklet} from "src/app/shared/types/bricklet";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";
import {ReactiveFormsModule} from "@angular/forms";

describe("HardwareIdComponent", () => {
    let component: HardwareIdComponent;
    let fixture: ComponentFixture<HardwareIdComponent>;

    let brickletService: jasmine.SpyObj<BrickletService>;

    let brickletSubject = new Subject();
    let brickletSubscriber: jasmine.Spy;

    const bricklet1 = new Bricklet("AAA", 1);
    const bricklet2 = new Bricklet("BBB", 2);
    const bricklet3 = new Bricklet("CCC", 3);

    beforeEach(async () => {
        const brickletServiceSpy = jasmine.createSpyObj("BrickletService", [
            "getBrickletObservable",
            "renameBrickletUid",
        ]);

        brickletServiceSpy.getBrickletObservable.and.returnValue(
            brickletSubject,
        );

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [HardwareIdComponent],
            providers: [
                {
                    provide: BrickletService,
                    useValue: brickletServiceSpy,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        brickletService = TestBed.inject(
            BrickletService,
        ) as jasmine.SpyObj<BrickletService>;
        brickletSubscriber = jasmine.createSpy();

        fixture = TestBed.createComponent(HardwareIdComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.bricklets.subscribe(brickletSubscriber);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get its bricklets from the service", () => {
        brickletSubject.next([bricklet1, bricklet2]);
        expect(brickletSubscriber).toHaveBeenCalledWith([bricklet1, bricklet2]);
        brickletSubject.next([bricklet3]);
        expect(brickletSubscriber).toHaveBeenCalledWith([bricklet3]);
    });
});
