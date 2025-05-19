import {TestBed} from "@angular/core/testing";

import {TokenService} from "./token.service";
import {RosService} from "./ros-service/ros.service";
import {of} from "rxjs";

describe("TokenServiceService", () => {
    let tokenService: TokenService;
    let rosService: jasmine.SpyObj<RosService>;

    beforeEach(() => {
        const rosServiceSpy = jasmine.createSpyObj("RosService", [
            "checkTokenExists",
        ]);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: RosService,
                    useValue: rosServiceSpy,
                },
            ],
        });
        tokenService = TestBed.inject(TokenService);
        rosService = TestBed.inject(RosService) as jasmine.SpyObj<RosService>;
    });

    it("should be created", () => {
        expect(tokenService).toBeTruthy();
    });

    it("should call rosService.checkTokenExists and update tokenStatus$", () => {
        const tokenResponse = {token_exists: true, token_active: true};
        rosService.checkTokenExists.and.returnValue(of(tokenResponse));

        tokenService.checkTokenExists();

        tokenService.tokenStatus$.subscribe((status) => {
            expect(status).toEqual({tokenExists: true, tokenActive: true});
            expect(rosService.checkTokenExists).toHaveBeenCalled();
        });
    });
});
