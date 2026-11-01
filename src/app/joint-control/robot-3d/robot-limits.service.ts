import {Injectable} from "@angular/core";
import {Observable, catchError, map, of, shareReplay} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";
import {MotorDTO} from "src/app/shared/types/motor-dto";

export type RobotMotorLimitsMap = Record<
    string,
    {minDeg: number; maxDeg: number}
>;

@Injectable()
export class RobotLimitsService {
    private cache: RobotMotorLimitsMap | null = null;
    private load$?: Observable<RobotMotorLimitsMap>;

    constructor(private readonly apiService: ApiService) {}

    /** One HTTP fetch per tab open; reused for every subscriber on this instance. */
    loadLimits(): Observable<RobotMotorLimitsMap> {
        if (this.cache != null) {
            return of(this.cache);
        }
        if (this.load$ == null) {
            this.load$ = this.apiService.get(UrlConstants.MOTOR).pipe(
                map((dto: {motors: MotorDTO[]}) => {
                    const limits: RobotMotorLimitsMap = {};
                    for (const motor of dto.motors ?? []) {
                        limits[motor.name] = {
                            minDeg: motor.rotationRangeMin / 100,
                            maxDeg: motor.rotationRangeMax / 100,
                        };
                    }
                    this.cache = limits;
                    return limits;
                }),
                catchError(() => {
                    this.cache = {};
                    return of({});
                }),
                shareReplay({bufferSize: 1, refCount: false}),
            );
        }
        return this.load$;
    }
}
