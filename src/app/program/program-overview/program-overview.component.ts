import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {map, Observable} from "rxjs";
import {ProgramService} from "src/app/shared/services/program.service";

@Component({
    selector: "app-program-overview",
    templateUrl: "./program-overview.component.html",
    styleUrl: "./program-overview.component.scss",
})
export class ProgramOverviewComponent implements OnInit {
    selected$!: Observable<string>;

    constructor(
        private programService: ProgramService,
        private router: Router,
    ) {}

    get isProgramTabActive(): boolean {
        return !this.router.url.includes("rgb-led-button");
    }

    ngOnInit(): void {
        this.selected$ = this.programService.programsSubject.pipe(
            map((programs) => programs[0]?.getUUID() ?? ""),
        );
    }
}
