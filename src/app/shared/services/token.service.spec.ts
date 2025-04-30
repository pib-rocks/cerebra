import {TestBed} from "@angular/core/testing";

import {TokenService} from "./token.service";
import {RosService} from "./ros-service/ros.service";
import {of} from "rxjs";

describe("TokenServiceService", () => {
    let service: TokenService;
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
        service = TestBed.inject(TokenService);
        rosService = TestBed.inject(RosService) as jasmine.SpyObj<RosService>;
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should call rosService.checkTokenExists and update tokenStatus$", () => {
        const tokenResponse = {token_exists: true, token_active: true};
        rosService.checkTokenExists.and.returnValue(of(tokenResponse));

        service.checkTokenExists();

        service.tokenStatus$.subscribe((status) => {
            expect(status).toEqual({tokenExists: true, tokenActive: true});
            expect(rosService.checkTokenExists).toHaveBeenCalled();
        });
    });
});
