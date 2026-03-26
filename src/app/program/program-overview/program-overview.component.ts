import {Component} from "@angular/core";
import {map, Observable} from "rxjs";
import {ProgramService} from "src/app/shared/services/program.service";

@Component({
    selector: "app-program-overview",
    templateUrl: "./program-overview.component.html",
    styleUrl: "./program-overview.component.scss",
})
export class ProgramOverviewComponent {
    selected$!: Observable<string>;

    constructor(private programService: ProgramService) {}

    ngOnInit(): void {
        this.selected$ = this.programService.programsSubject.pipe(
            map((programs) => programs[0]?.getUUID() ?? ""),
        );
    }
}
