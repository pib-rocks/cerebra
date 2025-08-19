import {Component, Input, ViewEncapsulation} from "@angular/core";

@Component({
    selector: "app-ip-retriever",
    templateUrl: "./ip-retriever.component.html",
    styleUrls: ["./ip-retriever.component.scss"],
})
export class IpRetrieverComponent {
    @Input() hostIp: string | null = null;
}
