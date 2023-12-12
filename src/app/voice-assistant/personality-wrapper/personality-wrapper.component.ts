import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: "app-personality-wrapper",
    templateUrl: "./personality-wrapper.component.html",
    styleUrls: ["./personality-wrapper.component.css"],
})
export class PersonalityWrapperComponent implements OnInit {
    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {}
    ngOnInit(): void {
        console.log("init");
        // const urlSegment: string|null = localStorage.getItem("voice-assistant");
        // urlSegment ? this.router.navigate([urlSegment], {relativeTo: this.route}) : this.router.navigate(["personality"], {relativeTo: this.route});
    }
}
