import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { UrlConstants } from "src/app/shared/services/url.constants";

export interface DiagnosticsSummary {
  overallStatus: string;
  cpuTemperature: number;
  cpuStatus: string;
  diskSpace: {
    total: string;
    used: string;
    free: string;
    percentUsed: number;
  };
  diskStatus: string;
  containersStatus: string;
  brickletsStatus: string;
  healthyContainersCount: number;
  totalContainersCount: number;
  totalBrickletsCount: number;
}

export interface BrickletPinTelemetry {
  pin: number;
  voltage: number;
  current: number;
}

export interface BrickletTelemetry {
  brickletNumber: number;
  uid: string;
  type: string;
  voltage: number;
  current: number;
  status: string;
  pins: BrickletPinTelemetry[];
}

export interface SystemTelemetry {
  cpuTemperature: number;
  diskSpace: {
    total: string;
    used: string;
    free: string;
    percentUsed: number;
  };
  containers: Array<{
    name: string;
    status: string;
    health: string;
  }>;
  status: string;
}

@Injectable({
  providedIn: "root",
})
export class DiagnosticsService {
  private baseUrl = UrlConstants.DIAGNOSTICS;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DiagnosticsSummary> {
    return this.http.get<DiagnosticsSummary>(`${this.baseUrl}/summary`);
  }

  getBricklets(): Observable<{ bricklets: BrickletTelemetry[] }> {
    return this.http.get<{ bricklets: BrickletTelemetry[] }>(`${this.baseUrl}/bricklets`);
  }

  getSystem(): Observable<SystemTelemetry> {
    return this.http.get<SystemTelemetry>(`${this.baseUrl}/system`);
  }
}
