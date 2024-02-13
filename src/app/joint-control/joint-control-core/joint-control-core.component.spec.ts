import {ComponentFixture, TestBed} from "@angular/core/testing";

import {JointControlCoreComponent} from "./joint-control-core.component";
import {RouterTestingModule} from "@angular/router/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {JointConfiguration} from "src/app/shared/types/joint-configuration";

fdescribe("JointControlCoreComponent", () => {
    let component: JointControlCoreComponent;
    let fixture: ComponentFixture<JointControlCoreComponent>;

    let initialConfig: JointConfiguration;
    let data: BehaviorSubject<any>;

    beforeEach(async () => {
        initialConfig = {
            jointPathName: "joint",
            label: "Joint",
            background: "/background-path",
            overlay: "/overlay-path",
            segmentHeight: 0.1,
            segmentOffset: 0.2,
            reversed: true,
            motors: [],
        };

        data = new BehaviorSubject({joint: initialConfig});

        await TestBed.configureTestingModule({
            declarations: [JointControlCoreComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {data},
                },
            ],
            imports: [RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(JointControlCoreComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should get its joint-configuration from the route", () => {
        expect(component.joint).toBe(initialConfig);
        const nextConfig: JointConfiguration = {
            jointPathName: "other-joint",
            label: "Other Joint",
            background: "/background-path",
            overlay: "/overlay-path",
            segmentHeight: 0.1,
            segmentOffset: 0.2,
            reversed: false,
            motors: [],
        };
        data.next({joint: nextConfig});
        expect(component.joint).toBe(nextConfig);
    });
});
