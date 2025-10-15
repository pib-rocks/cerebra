import {TestBed, ComponentFixture} from "@angular/core/testing";
import {RouterTestingModule} from "@angular/router/testing";
import {AppComponent} from "./app.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {SmartConnectComponent} from "./ui-components/smart-connect/smart-connect.component";
import {RelayControlComponent} from "./ui-components/relay-control/relay-control.component";
import {IpRetrieverComponent} from "./ui-components/ip-retriever/ip-retriever.component";

describe("AppComponent", () => {
    let fixture: ComponentFixture<AppComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientTestingModule],
            declarations: [
                AppComponent,
                SmartConnectComponent,
                RelayControlComponent,
                IpRetrieverComponent,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
    });

    it("should create the app", () => {
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });
});
