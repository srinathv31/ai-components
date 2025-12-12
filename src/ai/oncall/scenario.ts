export type OnCallScenarioId = "dynatrace-3am-demo";

export type OnCallScenarioPhase =
  | "incident"
  | "post-restart-good"
  | "post-restart-bad"
  | "rerouted"
  | "resolved";

export type DynatraceSeverity = "info" | "warning" | "critical";

export type DynatraceLogLine = {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  service: string;
  region: "azure-east" | "azure-central";
  statusCode: number;
  message: string;
  traceId?: string;
};

export type DynatraceSnapshot = {
  scenarioId: OnCallScenarioId;
  phase: OnCallScenarioPhase;
  observedAt: string;

  service: {
    name: string;
    endpoint: string;
    region: "azure-east";
  };

  health: {
    status: "degraded" | "down" | "healthy";
    severity: DynatraceSeverity;
    summary: string;
  };

  metrics: {
    windowMinutes: number;
    rpm: number;
    errorRatePct: number;
    statusCounts: Record<"2xx" | "4xx" | "5xx", number>;
    topStatusCodes: Array<{ code: number; count: number }>;
    p95LatencyMs: number;
  };

  logs: DynatraceLogLine[];

  /** Human-readable guidance for the agent. */
  hints: {
    recommendedAction:
      | "restart-service"
      | "prepare-f5-redirect"
      | "send-f5-redirect-email"
      | "monitor"
      | "declare-resolved";
    recommendedNextPhase: OnCallScenarioPhase;
    rationale: string;
  };
};

const nowIso = () => new Date().toISOString();

const makeLog = (
  partial: Omit<DynatraceLogLine, "timestamp" | "service" | "region"> & {
    timestamp?: string;
    service?: string;
    region?: DynatraceLogLine["region"];
  }
): DynatraceLogLine => ({
  timestamp: partial.timestamp ?? nowIso(),
  service: partial.service ?? "orders-api",
  region: partial.region ?? "azure-east",
  level: partial.level,
  statusCode: partial.statusCode,
  message: partial.message,
  traceId: partial.traceId,
});

/**
 * Deterministic, in-app “Dynatrace” snapshot generator.
 * This is intentionally opinionated so the demo story is consistent.
 */
export function getDynatraceSnapshotForPhase(
  scenarioId: OnCallScenarioId,
  phase: OnCallScenarioPhase
): DynatraceSnapshot {
  const base = {
    scenarioId,
    phase,
    observedAt: nowIso(),
    service: {
      name: "orders-api",
      endpoint: "https://api.company.com/orders",
      region: "azure-east" as const,
    },
  };

  if (phase === "incident") {
    return {
      ...base,
      health: {
        status: "degraded",
        severity: "critical",
        summary:
          "Elevated 4xx/5xx errors detected. Customers are intermittently failing to create orders.",
      },
      metrics: {
        windowMinutes: 5,
        rpm: 420,
        errorRatePct: 38.4,
        statusCounts: { "2xx": 259, "4xx": 98, "5xx": 63 },
        topStatusCodes: [
          { code: 400, count: 62 },
          { code: 401, count: 21 },
          { code: 500, count: 41 },
          { code: 503, count: 22 },
        ],
        p95LatencyMs: 1870,
      },
      logs: [
        makeLog({
          level: "ERROR",
          statusCode: 503,
          message: "Upstream timeout calling inventory-service",
          traceId: "trace-1b7a",
        }),
        makeLog({
          level: "ERROR",
          statusCode: 500,
          message: "Unhandled exception: null pointer in OrderController",
          traceId: "trace-8f21",
        }),
        makeLog({
          level: "WARN",
          statusCode: 400,
          message: "Validation error: missing customerId",
          traceId: "trace-2c09",
        }),
        makeLog({
          level: "WARN",
          statusCode: 401,
          message: "Auth token expired",
          traceId: "trace-6a3d",
        }),
      ],
      hints: {
        recommendedAction: "restart-service",
        recommendedNextPhase: "post-restart-good",
        rationale:
          "Mixed 4xx/5xx with latency spike suggests partial degradation; try a fast restart to clear bad state and recover.",
      },
    };
  }

  if (phase === "post-restart-good") {
    return {
      ...base,
      health: {
        status: "healthy",
        severity: "info",
        summary:
          "Restart improved success rate. Service appears stable (for now).",
      },
      metrics: {
        windowMinutes: 3,
        rpm: 410,
        errorRatePct: 1.2,
        statusCounts: { "2xx": 405, "4xx": 4, "5xx": 1 },
        topStatusCodes: [
          { code: 400, count: 3 },
          { code: 500, count: 1 },
        ],
        p95LatencyMs: 220,
      },
      logs: [
        makeLog({
          level: "INFO",
          statusCode: 200,
          message: "Order created successfully",
          traceId: "trace-7a11",
        }),
        makeLog({
          level: "WARN",
          statusCode: 400,
          message: "Validation error: missing lineItems",
          traceId: "trace-9c30",
        }),
      ],
      hints: {
        recommendedAction: "monitor",
        recommendedNextPhase: "post-restart-bad",
        rationale:
          "Restart was effective but this incident pattern often regresses. Re-check shortly to confirm stability.",
      },
    };
  }

  if (phase === "post-restart-bad") {
    return {
      ...base,
      health: {
        status: "down",
        severity: "critical",
        summary:
          "Sustained 5xx errors. Service is effectively down in azure-east after recent restart.",
      },
      metrics: {
        windowMinutes: 2,
        rpm: 380,
        errorRatePct: 96.1,
        statusCounts: { "2xx": 15, "4xx": 0, "5xx": 365 },
        topStatusCodes: [
          { code: 500, count: 303 },
          { code: 502, count: 44 },
          { code: 503, count: 18 },
        ],
        p95LatencyMs: 5100,
      },
      logs: [
        makeLog({
          level: "ERROR",
          statusCode: 500,
          message: "DB connection pool exhausted",
          traceId: "trace-5eaa",
        }),
        makeLog({
          level: "ERROR",
          statusCode: 502,
          message: "Bad gateway from upstream ALB",
          traceId: "trace-31dd",
        }),
        makeLog({
          level: "ERROR",
          statusCode: 503,
          message: "Service unavailable - circuit breaker open",
          traceId: "trace-12f0",
        }),
      ],
      hints: {
        recommendedAction: "prepare-f5-redirect",
        recommendedNextPhase: "rerouted",
        rationale:
          "Restart was attempted recently; sustained 5xx suggests deeper dependency/infra issue. Reduce blast radius by redirecting traffic to azure-central.",
      },
    };
  }

  if (phase === "rerouted") {
    return {
      ...base,
      health: {
        status: "healthy",
        severity: "warning",
        summary:
          "Traffic is redirected to azure-central. Customer impact mitigated; azure-east remains unhealthy.",
      },
      metrics: {
        windowMinutes: 5,
        rpm: 405,
        errorRatePct: 0.6,
        statusCounts: { "2xx": 401, "4xx": 2, "5xx": 2 },
        topStatusCodes: [
          { code: 400, count: 2 },
          { code: 500, count: 2 },
        ],
        p95LatencyMs: 260,
      },
      logs: [
        makeLog({
          level: "INFO",
          statusCode: 200,
          message: "Routing policy active: azure-east -> azure-central",
        }),
        makeLog({
          level: "WARN",
          statusCode: 500,
          message: "Residual 5xx from stale connections; trending down",
        }),
      ],
      hints: {
        recommendedAction: "declare-resolved",
        recommendedNextPhase: "resolved",
        rationale:
          "Customer traffic stabilized via failover. Mark incident mitigated and open follow-up to investigate azure-east root cause.",
      },
    };
  }

  // resolved
  return {
    ...base,
    health: {
      status: "healthy",
      severity: "info",
      summary:
        "Incident mitigated. Monitoring indicates stable traffic flow and low error rates.",
    },
    metrics: {
      windowMinutes: 10,
      rpm: 415,
      errorRatePct: 0.2,
      statusCounts: { "2xx": 414, "4xx": 1, "5xx": 0 },
      topStatusCodes: [{ code: 400, count: 1 }],
      p95LatencyMs: 240,
    },
    logs: [
      makeLog({
        level: "INFO",
        statusCode: 200,
        message: "All systems nominal (demo).",
      }),
    ],
    hints: {
      recommendedAction: "declare-resolved",
      recommendedNextPhase: "resolved",
      rationale: "Stable metrics across the monitoring window.",
    },
  };
}
