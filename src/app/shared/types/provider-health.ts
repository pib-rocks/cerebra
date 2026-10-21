/**
 * Provider health as the voice-assistant status strip shows it (PC-115).
 *
 * The probe itself runs in pib-backend (`GET /provider/<modelId>/health`),
 * because the provider credentials live in the robot key store and the cloud
 * refuses a browser preflight. This module only names the three outcomes and
 * turns one into a chip colour, so it is pure and testable without a browser.
 *
 * `healthy` is not plain reachability for pib.Cloud: the backend answers it
 * only when the service, the SmartConnect token and the token's remaining
 * budget are all fine. `unknown` means the probe could not run at all (no
 * stored key, locked key store, no probe endpoint) and must stay neutral - a
 * missing key is not an outage.
 *
 * Beside the state the backend reports the vendor's own view (`vendorStatus`),
 * read from the provider's public status feed. It needs no key, so it also
 * answers for an account this robot has no credential for, and it explains a
 * partial outage. It never recolours the chip: an account whose own request
 * answered stays green even while the vendor reports a fault.
 */

export type ProviderHealthState = "healthy" | "unreachable" | "unknown";

/** What the provider says about itself, told apart from what this robot saw. */
export type ProviderVendorStatus = "operational" | "degraded" | "unknown";

/** Whether a probe has answered yet; the chip waits while it is loading. */
export type ProviderHealthPhase = "idle" | "loading" | "done";

export interface ProviderHealth {
    state: ProviderHealthState;
    provider?: string | null;
    model?: string | null;
    apiName?: string | null;
    /** Which check answered: health, cloud_usage, or models. */
    probe?: string | null;
    /** Machine reason of a non-green or neutral outcome. */
    reason?: string | null;
    detail?: string | null;
    status?: number | null;
    latencyMs?: number | null;
    /** Remaining pib.Tokens; null with budgetKnown true means no ceiling. */
    budgetRemaining?: number | null;
    budgetKnown?: boolean;
    /** The vendor's own status feed: operational, degraded, or unreadable. */
    vendorStatus?: ProviderVendorStatus;
    vendorDetail?: string | null;
}

export const UNKNOWN_PROVIDER_HEALTH: ProviderHealth = {state: "unknown"};

export const HEALTH_LABELS: Record<ProviderHealthState, string> = {
    healthy: "reachable",
    unreachable: "unreachable",
    unknown: "not checked",
};

/** Reason codes the strip can explain without echoing a backend sentence. */
export const REASON_LABELS: Record<string, string> = {
    no_key: "no key stored",
    key_store_locked: "key store locked",
    unsupported: "no probe for this provider",
    unreachable: "no answer",
    http_status: "unexpected status",
    key_rejected: "key rejected",
    token_invalid: "token invalid",
    budget_exhausted: "budget exhausted",
    no_endpoint: "no probe configured",
    provider_outage: "provider reports an outage",
    backend_unavailable: "pib-backend unreachable",
};

/**
 * Chip class for one outcome. The neutral class is used for `unknown`, so a
 * provider the robot cannot probe never reads as a failure.
 */
export function healthCssClass(state: ProviderHealthState): string {
    if (state === "healthy") return "provider-health-healthy";
    if (state === "unreachable") return "provider-health-unreachable";
    return "provider-health-neutral";
}

/** Short word next to the provider name. */
export function healthLabel(health: ProviderHealth | null | undefined): string {
    return HEALTH_LABELS[health?.state ?? "unknown"];
}

/** Read a raw response into the shape the strip uses. */
export function parseProviderHealth(raw: unknown): ProviderHealth {
    if (raw == null || typeof raw !== "object") {
        return {...UNKNOWN_PROVIDER_HEALTH};
    }
    const source = raw as Record<string, unknown>;
    const state = source["state"];
    if (state !== "healthy" && state !== "unreachable" && state !== "unknown") {
        return {...UNKNOWN_PROVIDER_HEALTH};
    }
    return {
        state,
        provider: asString(source["provider"]),
        model: asString(source["model"]),
        apiName: asString(source["apiName"]),
        probe: asString(source["probe"]),
        reason: asString(source["reason"]),
        detail: asString(source["detail"]),
        status: asNumber(source["status"]),
        latencyMs: asNumber(source["latencyMs"]),
        budgetRemaining: asNumber(source["budgetRemaining"]),
        budgetKnown: source["budgetKnown"] === true,
        vendorStatus: asVendorStatus(source["vendorStatus"]),
        vendorDetail: asString(source["vendorDetail"]),
    };
}

/**
 * One sentence for the chip's tooltip: what was checked, how long it took,
 * and - when the budget is known - what is left of it.
 */
export function healthTooltip(
    health: ProviderHealth | null | undefined,
    providerLabel: string,
): string {
    if (health == null) {
        return `${providerLabel}: health not checked yet.`;
    }
    const parts: string[] = [];
    const name = health.model?.trim() || providerLabel;
    if (health.state === "healthy") {
        parts.push(`${name} is ${HEALTH_LABELS.healthy}.`);
    } else if (health.state === "unreachable") {
        const reason = reasonLabel(health.reason);
        parts.push(`${name} is ${HEALTH_LABELS.unreachable} (${reason}).`);
    } else {
        const reason = reasonLabel(health.reason);
        parts.push(`${name}: health not checked (${reason}).`);
    }
    if (health.detail) {
        parts.push(health.detail);
    }
    if (health.vendorStatus === "degraded") {
        const fault = health.vendorDetail?.trim();
        parts.push(
            `${health.provider?.trim() || providerLabel} reports a fault` +
                (fault ? `: ${fault}` : "."),
        );
    } else if (health.vendorStatus === "operational") {
        parts.push("The provider reports no fault.");
    }
    if (health.budgetKnown) {
        parts.push(
            health.budgetRemaining == null
                ? "Budget: no ceiling."
                : `Budget left: ${formatBudget(
                      health.budgetRemaining,
                  )} pib.Tokens.`,
        );
    }
    if (health.latencyMs != null) {
        parts.push(`${health.latencyMs} ms.`);
    }
    return parts.join(" ");
}

export function reasonLabel(reason: string | null | undefined): string {
    if (!reason) return "unknown reason";
    return REASON_LABELS[reason] ?? reason;
}

function formatBudget(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function asString(value: unknown): string | null {
    return typeof value === "string" && value.trim() !== "" ? value : null;
}

function asVendorStatus(value: unknown): ProviderVendorStatus {
    if (
        value === "operational" ||
        value === "degraded" ||
        value === "unknown"
    ) {
        return value;
    }
    return "unknown";
}

function asNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
