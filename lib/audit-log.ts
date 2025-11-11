/**
 * Audit Log System
 *
 * Tracks all LLM tool/function calls to verify the LLM never directly
 * mutates game state without using the proper tools/functions.
 *
 * Critical for Phase 0 exit criteria.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: "llm_call" | "tool_call" | "state_mutation" | "error";
  source: "generate_customer" | "process_order" | "system";

  // LLM interaction details
  model?: string;
  prompt?: string;
  response?: unknown;
  toolsUsed?: string[];

  // Tool call details
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: unknown;

  // State change tracking
  stateBefore?: unknown;
  stateAfter?: unknown;
  stateChanged?: boolean;

  // Error tracking
  error?: string;
  stack?: string;

  // Metadata
  sessionId?: string;
  userId?: string;
  duration?: number;
}

export interface AuditLogStats {
  totalCalls: number;
  llmCalls: number;
  toolCalls: number;
  errors: number;
  unauthorizedMutations: number; // LLM mutations without tools
  averageDuration: number;
  callsByTool: Record<string, number>;
}

/**
 * In-memory audit log store
 * In production, this would be persisted to a database
 */
class AuditLog {
  private logs: AuditLogEntry[] = [];
  private maxSize: number = 1000; // Keep last 1000 entries
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Log an LLM call
   */
  logLLMCall(params: {
    source: AuditLogEntry["source"];
    model: string;
    prompt?: string;
    response?: unknown;
    toolsUsed?: string[];
    duration?: number;
  }): string {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: "llm_call",
      sessionId: this.sessionId,
      ...params,
    };

    this.addEntry(entry);
    return entry.id;
  }

  /**
   * Log a tool/function call
   */
  logToolCall(params: {
    source: AuditLogEntry["source"];
    toolName: string;
    toolArgs?: unknown;
    toolResult?: unknown;
    duration?: number;
  }): string {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: "tool_call",
      sessionId: this.sessionId,
      ...params,
    };

    this.addEntry(entry);
    return entry.id;
  }

  /**
   * Log a state mutation
   * This is CRITICAL - if LLM mutates state without tools, flag it
   */
  logStateMutation(params: {
    source: AuditLogEntry["source"];
    stateBefore?: unknown;
    stateAfter?: unknown;
    stateChanged: boolean;
    authorizedBy?: string; // Tool call ID that authorized this mutation
  }): string {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: "state_mutation",
      sessionId: this.sessionId,
      ...params,
    };

    this.addEntry(entry);

    // If state changed without authorization, log error
    if (params.stateChanged && !params.authorizedBy) {
      this.logError({
        source: params.source,
        error: "UNAUTHORIZED STATE MUTATION: LLM mutated state without using tools!",
        stack: new Error().stack,
      });
    }

    return entry.id;
  }

  /**
   * Log an error
   */
  logError(params: {
    source: AuditLogEntry["source"];
    error: string;
    stack?: string;
    toolName?: string;
  }): string {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: "error",
      sessionId: this.sessionId,
      ...params,
    };

    this.addEntry(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("[AUDIT ERROR]", params.error);
    }

    return entry.id;
  }

  /**
   * Get all logs
   */
  getLogs(filter?: {
    type?: AuditLogEntry["type"];
    source?: AuditLogEntry["source"];
    since?: number;
    limit?: number;
  }): AuditLogEntry[] {
    let filtered = [...this.logs];

    if (filter?.type) {
      filtered = filtered.filter(log => log.type === filter.type);
    }

    if (filter?.source) {
      filtered = filtered.filter(log => log.source === filter.source);
    }

    if (filter?.since !== undefined) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Get statistics
   */
  getStats(): AuditLogStats {
    const callsByTool: Record<string, number> = {};
    let totalDuration = 0;
    let countWithDuration = 0;

    this.logs.forEach(log => {
      if (log.toolName) {
        callsByTool[log.toolName] = (callsByTool[log.toolName] || 0) + 1;
      }
      if (log.duration) {
        totalDuration += log.duration;
        countWithDuration++;
      }
    });

    const unauthorizedMutations = this.logs.filter(
      log => log.type === "error" && log.error?.includes("UNAUTHORIZED")
    ).length;

    return {
      totalCalls: this.logs.length,
      llmCalls: this.logs.filter(l => l.type === "llm_call").length,
      toolCalls: this.logs.filter(l => l.type === "tool_call").length,
      errors: this.logs.filter(l => l.type === "error").length,
      unauthorizedMutations,
      averageDuration: countWithDuration > 0 ? totalDuration / countWithDuration : 0,
      callsByTool,
    };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: Date.now(),
      stats: this.getStats(),
      logs: this.logs,
    }, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Check if system is compliant (no unauthorized mutations)
   */
  isCompliant(): boolean {
    const stats = this.getStats();
    return stats.unauthorizedMutations === 0;
  }

  // Private methods

  private addEntry(entry: AuditLogEntry): void {
    this.logs.push(entry);

    // Trim if exceeds max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Singleton instance
export const auditLog = new AuditLog();

/**
 * Helper function to wrap LLM calls with audit logging
 */
export async function auditedLLMCall<T>(params: {
  source: AuditLogEntry["source"];
  model: string;
  prompt?: string;
  fn: () => Promise<T>;
}): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await params.fn();
    const duration = Date.now() - startTime;

    auditLog.logLLMCall({
      source: params.source,
      model: params.model,
      prompt: params.prompt,
      response: result,
      duration,
    });

    return result;
  } catch (error) {
    auditLog.logError({
      source: params.source,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Helper function to wrap tool calls with audit logging
 */
export function auditedToolCall<T>(params: {
  source: AuditLogEntry["source"];
  toolName: string;
  toolArgs?: unknown;
  fn: () => T;
}): T {
  const startTime = Date.now();

  try {
    const result = params.fn();
    const duration = Date.now() - startTime;

    auditLog.logToolCall({
      source: params.source,
      toolName: params.toolName,
      toolArgs: params.toolArgs,
      toolResult: result,
      duration,
    });

    return result;
  } catch (error) {
    auditLog.logError({
      source: params.source,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      toolName: params.toolName,
    });

    throw error;
  }
}
