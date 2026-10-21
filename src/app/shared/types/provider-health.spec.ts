import {
    ProviderHealth,
    healthCssClass,
    healthLabel,
    healthTooltip,
    parseProviderHealth,
    reasonLabel,
} from "./provider-health";

describe("provider health (PC-115)", () => {
    it("maps the three backend states to the chip colours", () => {
        expect(healthCssClass("healthy")).toBe("provider-health-healthy");
        expect(healthCssClass("unreachable")).toBe(
            "provider-health-unreachable",
        );
        expect(healthCssClass("unknown")).toBe("provider-health-neutral");
    });

    it("keeps an unknown outcome neutral instead of calling it a failure", () => {
        const health = parseProviderHealth({
            state: "unknown",
            reason: "no_key",
            provider: "pib.Cloud",
        });

        expect(health.state).toBe("unknown");
        expect(healthCssClass(health.state)).toBe("provider-health-neutral");
        expect(healthLabel(health)).toBe("not checked");
    });

    it("reads a healthy cloud answer with its remaining budget", () => {
        const health = parseProviderHealth({
            state: "healthy",
            provider: "pib.Cloud",
            model: "pib.Cloud",
            probe: "cloud_usage",
            status: 200,
            latencyMs: 63,
            budgetKnown: true,
            budgetRemaining: 412.5,
        });

        expect(health.state).toBe("healthy");
        expect(health.budgetKnown).toBeTrue();
        expect(health.budgetRemaining).toBe(412.5);
        expect(healthLabel(health)).toBe("reachable");
        expect(healthTooltip(health, "pib.Cloud")).toContain(
            "Budget left: 412.5 pib.Tokens",
        );
        expect(healthTooltip(health, "pib.Cloud")).toContain("63 ms");
    });

    it("names an unlimited budget instead of showing a number", () => {
        const health = parseProviderHealth({
            state: "healthy",
            budgetKnown: true,
            budgetRemaining: null,
        });

        expect(healthTooltip(health, "pib.Cloud")).toContain(
            "Budget: no ceiling",
        );
    });

    it("explains a spent budget and an invalid token in the tooltip", () => {
        const spent = parseProviderHealth({
            state: "unreachable",
            reason: "budget_exhausted",
            budgetKnown: true,
            budgetRemaining: 0,
        });
        const invalid = parseProviderHealth({
            state: "unreachable",
            reason: "token_invalid",
        });

        expect(healthLabel(spent)).toBe("unreachable");
        expect(healthTooltip(spent, "pib.Cloud")).toContain("budget exhausted");
        expect(healthTooltip(invalid, "pib.Cloud")).toContain("token invalid");
    });

    it("uses the model label from the answer over the catalogue label", () => {
        const health = parseProviderHealth({
            state: "healthy",
            model: "pib.Cloud",
        });

        expect(healthTooltip(health, "Fallback Name")).toContain(
            "pib.Cloud is",
        );
    });

    it("treats a malformed answer as unknown", () => {
        expect(parseProviderHealth(null).state).toBe("unknown");
        expect(parseProviderHealth({state: "perhaps"}).state).toBe("unknown");
        expect(parseProviderHealth("ok").state).toBe("unknown");
    });

    it("says so when nothing has been checked yet", () => {
        expect(healthTooltip(null, "GPT-6")).toContain("not checked yet");
    });

    it("falls back to the raw reason for a code it does not know", () => {
        expect(reasonLabel("brand_new_code")).toBe("brand_new_code");
        expect(reasonLabel(null)).toBe("unknown reason");
    });

    it("never reports a budget figure when the payload had none", () => {
        const health: ProviderHealth = parseProviderHealth({
            state: "healthy",
            budgetKnown: false,
        });

        expect(healthTooltip(health, "pib.Cloud")).not.toContain("Budget");
    });

    it("says when the provider reports a fault beside a working account", () => {
        const health = parseProviderHealth({
            state: "healthy",
            provider: "Anthropic",
            vendorStatus: "degraded",
            vendorDetail: "Elevated error rates",
        });

        // The chip colour stays a fact about this account; the vendor's own
        // view only explains it.
        expect(healthCssClass(health.state)).toBe("provider-health-healthy");
        expect(healthTooltip(health, "Anthropic")).toContain(
            "Anthropic reports a fault: Elevated error rates",
        );
    });

    it("names an outage as the reason when the vendor feed agrees", () => {
        const health = parseProviderHealth({
            state: "unreachable",
            reason: "provider_outage",
            vendorStatus: "degraded",
        });

        expect(healthTooltip(health, "OpenAI")).toContain(
            "provider reports an outage",
        );
    });

    it("keeps a vendor fault neutral when the feed is all that answered", () => {
        const health = parseProviderHealth({
            state: "unknown",
            reason: "no_key",
            vendorStatus: "degraded",
            vendorDetail: "Gemini API serving errors",
        });

        expect(healthCssClass(health.state)).toBe("provider-health-neutral");
        expect(healthTooltip(health, "Google")).toContain(
            "Gemini API serving errors",
        );
    });

    it("reports an operational vendor without repeating a reason", () => {
        const health = parseProviderHealth({
            state: "healthy",
            vendorStatus: "operational",
        });

        expect(healthTooltip(health, "OpenAI")).toContain(
            "The provider reports no fault.",
        );
    });

    it("treats a missing or odd vendor status as unknown", () => {
        expect(parseProviderHealth({state: "healthy"}).vendorStatus).toBe(
            "unknown",
        );
        expect(
            parseProviderHealth({state: "healthy", vendorStatus: "weird"})
                .vendorStatus,
        ).toBe("unknown");
        const health = parseProviderHealth({state: "healthy"});
        expect(healthTooltip(health, "OpenAI")).not.toContain("fault");
    });
});
