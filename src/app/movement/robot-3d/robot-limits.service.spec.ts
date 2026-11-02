import {TestBed} from "@angular/core/testing";
import {of, throwError} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {RobotLimitsService} from "./robot-limits.service";

describe("RobotLimitsService", () => {
    let apiService: jasmine.SpyObj<ApiService>;

    beforeEach(() => {
        apiService = jasmine.createSpyObj("ApiService", ["get"]);
        TestBed.configureTestingModule({
            providers: [
                RobotLimitsService,
                {provide: ApiService, useValue: apiService},
            ],
        });
    });

    it("maps rotation range centidegrees to degrees", (done) => {
        apiService.get.and.returnValue(
            of({
                motors: [
                    {
                        name: "shoulder",
                        rotationRangeMin: -9000,
                        rotationRangeMax: 9000,
                    },
                ],
            }),
        );
        const service = TestBed.inject(RobotLimitsService);

        service.loadLimits().subscribe((limits) => {
            expect(limits["shoulder"]).toEqual({minDeg: -90, maxDeg: 90});
            done();
        });
    });

    it("returns an empty map when the motor API fails", (done) => {
        apiService.get.and.returnValue(throwError(() => new Error("network")));
        const service = TestBed.inject(RobotLimitsService);

        service.loadLimits().subscribe((limits) => {
            expect(limits).toEqual({});
            done();
        });
    });

    it("caches the result for the lifetime of the service instance", () => {
        apiService.get.and.returnValue(
            of({
                motors: [
                    {
                        name: "elbow",
                        rotationRangeMin: 0,
                        rotationRangeMax: 18000,
                    },
                ],
            }),
        );
        const service = TestBed.inject(RobotLimitsService);

        service.loadLimits().subscribe();
        service.loadLimits().subscribe();

        expect(apiService.get).toHaveBeenCalledTimes(1);
    });
});
