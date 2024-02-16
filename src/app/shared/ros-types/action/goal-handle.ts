import {Observable} from "rxjs";

export interface GoalHandle<FeedbackType, ResultType> {
    feedback: Observable<FeedbackType>;
    result: Observable<ResultType>;
    status: Observable<number>;
    cancel: () => void;
}
