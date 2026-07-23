/// <reference types="@angular/localize" />

import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";

import {
    provideZoneChangeDetection,
    ErrorHandler,
    importProvidersFrom,
} from "@angular/core";
import {HIGHLIGHT_OPTIONS, HighlightModule} from "ngx-highlightjs";
import {CerebraErrorHandler} from "./app/global-error-handler/service/cerebra-error-handler.service";
import {BrowserModule, bootstrapApplication} from "@angular/platform-browser";
import {AppRoutingModule} from "./app/app-routing.module";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import {MatDialogModule} from "@angular/material/dialog";
import {MatTooltipModule} from "@angular/material/tooltip";
import {NgbModule, NgbDropdownModule} from "@ng-bootstrap/ng-bootstrap";
import {MatSliderModule} from "@angular/material/slider";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AngularSplitModule} from "angular-split";
import {NgOptimizedImage} from "@angular/common";
import {MarkdownModule} from "ngx-markdown";
import {AppComponent} from "./app/app.component";

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            BrowserModule,
            AppRoutingModule,
            ReactiveFormsModule,
            HttpClientModule,
            MatDialogModule,
            MatTooltipModule,
            NgbModule,
            MatSliderModule,
            BrowserAnimationsModule,
            NgbDropdownModule,
            FormsModule,
            AngularSplitModule,
            HighlightModule,
            NgOptimizedImage,
            MarkdownModule.forRoot(),
        ),
        provideZoneChangeDetection(),
        {
            provide: HIGHLIGHT_OPTIONS,
            useValue: {
                coreLibraryLoader: () => import("highlight.js/lib/core"),
                languages: {
                    python: () => import("highlight.js/lib/languages/python"),
                },
            },
        },
        {
            provide: ErrorHandler,
            useClass: CerebraErrorHandler,
        },
    ],
}).catch((err) => console.error(err));
