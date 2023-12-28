import {Observable} from "rxjs";

export interface GoalHandle<T, U> {
    response: Observable<T>;
    feedback: Observable<U>;
    cancel: () => void;
}
