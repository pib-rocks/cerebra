import {TestBed} from "@angular/core/testing";

import {UtilService} from "./util.service";

describe("UtilService", () => {
    let service: UtilService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UtilService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should get the existing value from the map", () => {
        const map = new Map();
        const key = "test-key";
        const val = "test-val";
        map.set(key, val);
        const defaultSpy = jasmine.createSpy();
        expect(service.getFromMapOrDefault(map, key, defaultSpy)).toBe(val);
        expect(defaultSpy).not.toHaveBeenCalled();
    });

    it("should store the default value in the map and return it", () => {
        const map = new Map();
        const key = "test-key";
        const val = "test-val";
        const defaultSpy = jasmine.createSpy().and.returnValue(val);
        expect(service.getFromMapOrDefault(map, key, defaultSpy)).toBe(val);
        expect(defaultSpy).toHaveBeenCalled();
        expect(map.get(key)).toBe(val);
    });
});
