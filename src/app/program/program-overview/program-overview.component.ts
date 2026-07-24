import {Component, OnInit, ChangeDetectionStrategy} from "@angular/core";
import {
    Router,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
} from "@angular/router";
import {map, Observable} from "rxjs";
import {ProgramService} from "src/app/shared/services/program.service";

@Component({
    selector: "app-program-overview",
    templateUrl: "./program-overview.component.html",
    styleUrl: "./program-overview.component.scss",
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, RouterLinkActive, RouterOutlet],
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
