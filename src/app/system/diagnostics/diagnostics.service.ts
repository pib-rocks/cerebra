import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "src/app/shared/services/api.service";
import { UrlConstants } from "src/app/shared/services/url.constants";

export interface DiagnosticsSummary {
  overallStatus: string;
  cpuTemperature: number;
  cpuStatus: string;
  cpuPercent?: number;
  cpuUsagePercent?: number;
  cpuUsage?: number;
  memoryUsage?: {
    total: string;
    used: string;
    free: string;
    percentUsed: number;
  };
  memoryStatus?: string;
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
  color?: string;
  pressState?: string;
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
  constructor(private apiService: ApiService) {}

  getSummary(): Observable<DiagnosticsSummary> {
    return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/summary`);
  }

  getBricklets(): Observable<{ bricklets: BrickletTelemetry[] }> {
    return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/bricklets`);
  }

  getSystem(): Observable<SystemTelemetry> {
    return this.apiService.get(`${UrlConstants.DIAGNOSTICS}/system`);
  }
}
