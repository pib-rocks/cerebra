import {ActivatedRouteSnapshot, ResolveFn} from "@angular/router";
import {Motor} from "../shared/types/motor.class";
import {MotorService} from "../shared/services/motor.service";
import {Group} from "../shared/types/motor.enum";
import {inject} from "@angular/core";

export const motorResolver: ResolveFn<Motor[]> = (
    route: ActivatedRouteSnapshot,
) => {
    switch (route.url[0].toString()) {
        case "head": {
            return inject(MotorService).updateMotorGroupFromApi(Group.head);
        }
        case "hand": {
            return inject(MotorService).updateMotorGroupFromApi(
                route.url[1].toString() === "left"
                    ? Group.left_hand
                    : Group.right_hand,
            );
        }
        case "arm": {
            return inject(MotorService).updateMotorGroupFromApi(
                route.url[1].toString() === "left"
                    ? Group.left_arm
                    : Group.right_arm,
            );
        }
        default: {
            return [];
        }
    }
};
