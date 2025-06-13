import {TestBed} from "@angular/core/testing";
import {BrickletService} from "./bricklet.service";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";
import {ApiService} from "./api.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Bricklet} from "../types/bricklet";
import {of, throwError} from "rxjs";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

describe("BrickletService", () => {
    let brickletService: BrickletService;
    let apiService: jasmine.SpyObj<ApiService>;
    let matSnackBarService: jasmine.SpyObj<MatSnackBar>;

    let brickletSubscriber: jasmine.Spy;
    const bricklet1 = new Bricklet("brick1", 1, "Servo Bricklet");
    const bricklet2 = new Bricklet("brick2", 2, "Servo Bricklet");
    const bricklet3 = new Bricklet("brick3", 3, "Solid State Relay Bricklet");
    const bricklets: Bricklet[] = [bricklet1, bricklet2, bricklet3];

    beforeEach(() => {
        const apiServiceSpy: jasmine.SpyObj<ApiService> = jasmine.createSpyObj(
            "ApiService",
            ["get", "put"],
        );
        apiServiceSpy.get.and.returnValue(of({bricklets}));

        const matSnackBarServiceSpy = jasmine.createSpyObj("MatSnackBar", [
            "open",
        ]);
        brickletSubscriber = jasmine.createSpy();

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                BrickletService,
                [
                    {
                        provide: ApiService,
                        useValue: apiServiceSpy,
                    },
                    {
                        provide: MatSnackBar,
                        useValue: matSnackBarServiceSpy,
                    },
                ],
            ],
            imports: [BrowserAnimationsModule],
        });
        matSnackBarService = TestBed.inject(
            MatSnackBar,
        ) as jasmine.SpyObj<MatSnackBar>;
        apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
        brickletService = TestBed.inject(BrickletService);
        brickletService.getBrickletObservable().subscribe(brickletSubscriber);
    });

    it("should be created", () => {
        expect(brickletService).toBeTruthy();
    });

    it("should return the correct observable", () => {
        expect(brickletSubscriber).toHaveBeenCalledOnceWith([
            bricklet1,
            bricklet2,
            bricklet3,
        ]);
    });

    it("should rename the bricklet-uid", () => {
        const uid = "newUid";
        const updatedBricklet1 = new Bricklet(
            uid,
            bricklet1.brickletNumber,
            "Servo Bricklet",
        );
        const updatedBricklets: Bricklet[] = [
            updatedBricklet1,
            bricklet2,
            bricklet3,
        ];
        apiService.put.and.returnValue(of(updatedBricklets));

        brickletService.renameBrickletUid(updatedBricklets);

        expect(apiService.put).toHaveBeenCalledTimes(6);
        expect(apiService.put).toHaveBeenCalledWith(
            "/bricklet/" + updatedBricklet1.brickletNumber,
            {uid: "temp1"},
        );
        expect(apiService.put).toHaveBeenCalledWith(
            "/bricklet/" + bricklet2.brickletNumber,
            {uid: "temp2"},
        );
        expect(apiService.put).toHaveBeenCalledWith(
            "/bricklet/" + bricklet3.brickletNumber,
            {uid: "temp3"},
        );
        expect(apiService.put).toHaveBeenCalledWith(
            "/bricklet/" + updatedBricklet1.brickletNumber,
            {uid},
        );
        expect(apiService.put).toHaveBeenCalledWith(
            "/bricklet/" + bricklet2.brickletNumber,
            {uid: bricklet2.uid},
        );
        expect(apiService.put).toHaveBeenCalledWith(
            "/bricklet/" + bricklet3.brickletNumber,
            {uid: bricklet3.uid},
        );
        expect(brickletSubscriber).toHaveBeenCalledWith(updatedBricklets);
    });

    it("should open a success snackbar on successful bricklet-uid change", () => {
        const uid = "newUid";
        const updatedBricklet1 = new Bricklet(
            uid,
            bricklet1.brickletNumber,
            "Servo Bricklet",
        );
        const updatedBricklets: Bricklet[] = [
            updatedBricklet1,
            bricklet2,
            bricklet3,
        ];
        apiService.put.and.returnValue(of(updatedBricklets));

        brickletService.renameBrickletUid(updatedBricklets);

        expect(matSnackBarService.open).toHaveBeenCalledOnceWith(
            "Hardware-IDs successfully set!",
            "",
            {
                panelClass: "cerebra-toast",
                duration: 3000,
            },
        );
    });

    it("should show correct error snackbar if dummy-uid update fails", () => {
        apiService.put.and.returnValue(throwError(() => new Error("Error")));

        brickletService.renameBrickletUid(bricklets);

        expect(apiService.put).toHaveBeenCalledTimes(3);
        expect(matSnackBarService.open).toHaveBeenCalledOnceWith(
            "Error! Temporary IDs could not be set. Please try again.",
            "",
            {
                panelClass: "cerebra-toast",
                duration: 3000,
            },
        );
    });

    it("should show correct error snackbar if real uid-update fails", () => {
        apiService.put
            .withArgs(
                jasmine.any(String),
                jasmine.objectContaining({
                    uid: jasmine.stringMatching(/^temp/),
                }),
            )
            .and.returnValue(of(null));

        apiService.put
            .withArgs(
                jasmine.any(String),
                jasmine.objectContaining({
                    uid: jasmine.stringMatching(/^brick/),
                }),
            )
            .and.returnValue(throwError(() => new Error("Error")));

        brickletService.renameBrickletUid(bricklets);

        expect(apiService.put).toHaveBeenCalledTimes(6);
        expect(matSnackBarService.open).toHaveBeenCalledOnceWith(
            "Error! IDs could not be set.",
            "",
            {
                panelClass: "cerebra-toast",
                duration: 3000,
            },
        );
    });

    it("should return the correct bricklet by number", () => {
        const result = brickletService.getBricklet(1);
        expect(result).toEqual(bricklet1);
    });

    it("should return undefined if bricklet number does not exist", () => {
        const result = brickletService.getBricklet(666);
        expect(result).toBeUndefined();
    });
});
