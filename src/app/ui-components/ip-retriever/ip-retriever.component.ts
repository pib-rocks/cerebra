import {Component, OnInit} from "@angular/core";
import {ApiService} from "src/app/shared/services/api.service";
import {UrlConstants} from "src/app/shared/services/url.constants";

@Component({
    selector: "app-ip-retriever",
    templateUrl: "./ip-retriever.component.html",
    styleUrls: ["./ip-retriever.component.scss"],
})
export class IpRetrieverComponent implements OnInit {
    hostIp: string = "";
    constructor(private apiService: ApiService) {}

    ngOnInit() {
        this.apiService.get(UrlConstants.HOST_IP).subscribe({
            next: (response) => {
                this.hostIp = response.host_ip;
            },
            error: (err) => {
                console.log(err.error.error);
            },
        });
    }
}
