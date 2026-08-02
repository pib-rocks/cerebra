import { TestBed } from "@angular/core/testing";
import {
  DiagnosticsService,
  HardwareConfig,
} from "./diagnostics.service";
import { ApiService } from "src/app/shared/services/api.service";
import { of } from "rxjs";
import { UrlConstants } from "src/app/shared/services/url.constants";

describe("DiagnosticsService hardware-config", () => {
  let service: DiagnosticsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const sampleConfig: HardwareConfig = {
    version: 1,
    bricklets: [
      { brickletNumber: 1, uid: "ABC123", type: "Servo Bricklet" },
      { brickletNumber: 2, uid: "DEF456", type: "RGB LED Button Bricklet" },
    ],
    motors: [
      {
        name: "head_pan",
        pulseWidthMin: 700,
        pulseWidthMax: 2500,
        rotationRangeMin: -9000,
        rotationRangeMax: 9000,
        velocity: 10000,
        acceleration: 10000,
        deceleration: 10000,
        period: 19500,
        turnedOn: true,
        visible: true,
        invert: false,
        brickletPins: [{ brickletNumber: 1, pin: 0, invert: false }],
      },
    ],
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj("ApiService", ["get", "post"]);
    apiServiceSpy.get.and.returnValue(of(sampleConfig));
    apiServiceSpy.post.and.returnValue(of(sampleConfig));

    TestBed.configureTestingModule({
      providers: [
        DiagnosticsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(DiagnosticsService);
  });

  it("should GET hardware-config export via ApiService", () => {
    let result: HardwareConfig | undefined;
    service.exportHardwareConfig().subscribe((config) => (result = config));

    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      `${UrlConstants.HARDWARE_CONFIG}/export`
    );
    expect(result).toEqual(sampleConfig);
  });

  it("should POST hardware-config import via ApiService", () => {
    let result: HardwareConfig | undefined;
    service.importHardwareConfig(sampleConfig).subscribe((config) => (result = config));

    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      `${UrlConstants.HARDWARE_CONFIG}/import`,
      sampleConfig
    );
    expect(result).toEqual(sampleConfig);
  });

  it("should download hardware-config as JSON file", () => {
    const createObjectURLSpy = spyOn(URL, "createObjectURL").and.returnValue(
      "blob:mock"
    );
    const revokeObjectURLSpy = spyOn(URL, "revokeObjectURL");
    const clickSpy = jasmine.createSpy("click");
    const createElementSpy = spyOn(document, "createElement").and.returnValue({
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    jasmine.clock().install();
    service.downloadHardwareConfig(sampleConfig);
    jasmine.clock().tick(10000);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock");
    jasmine.clock().uninstall();
  });

  it("should validate a correct hardware-config document", () => {
    const result = service.validateHardwareConfig(sampleConfig);

    expect(result.valid).toBeTrue();
    expect(result.errors).toEqual([]);
    expect(result.config?.bricklets.length).toBe(2);
    expect(result.config?.motors[0].name).toBe("head_pan");
  });

  it("should reject invalid JSON content", () => {
    const result = service.parseHardwareConfigFileContent("{not-json");

    expect(result.valid).toBeFalse();
    expect(result.errors[0]).toContain("valid JSON");
  });

  it("should reject duplicate UIDs and invalid UID formats", () => {
    const result = service.validateHardwareConfig({
      version: 1,
      bricklets: [
        { brickletNumber: 1, uid: "DUP001", type: "Servo Bricklet" },
        { brickletNumber: 2, uid: "DUP001", type: "Servo Bricklet" },
        { brickletNumber: 3, uid: "BAD!", type: "Servo Bricklet" },
      ],
      motors: [],
    });

    expect(result.valid).toBeFalse();
    expect(result.errors.some((e) => e.includes("Duplicate Bricklet UID"))).toBeTrue();
    expect(result.errors.some((e) => e.includes("invalid format"))).toBeTrue();
  });

  it("should reject missing bricklets/motors arrays", () => {
    const result = service.validateHardwareConfig({ version: 1 });

    expect(result.valid).toBeFalse();
    expect(result.errors.some((e) => e.includes("'bricklets' array"))).toBeTrue();
    expect(result.errors.some((e) => e.includes("'motors' array"))).toBeTrue();
  });
});
