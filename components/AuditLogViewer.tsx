"use client";

import { useState, useEffect } from "react";
import type { AuditLogEntry, AuditLogStats } from "@/lib/audit-log";

/**
 * Audit Log Viewer Component
 *
 * Displays audit log entries and statistics for monitoring LLM compliance.
 * Critical for Phase 0 exit criteria - verifies LLM never mutates state without tools.
 */
export function AuditLogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "llm_call" | "tool_call" | "error">("all");
  const [limit, setLimit] = useState(10);
  const [stats, setStats] = useState<AuditLogStats>({
    totalCalls: 0,
    llmCalls: 0,
    toolCalls: 0,
    errors: 0,
    unauthorizedMutations: 0,
    averageDuration: 0,
    callsByTool: {},
  });
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isCompliant, setIsCompliant] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch logs from server
  useEffect(() => {
    if (!isOpen) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("type", filter);
        params.set("limit", limit.toString());

        const response = await fetch(`/api/audit-logs?${params}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setLogs(data.logs);
          setIsCompliant(data.isCompliant);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    // Refresh every 2 seconds when open
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [isOpen, filter, limit]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-all font-semibold flex items-center gap-2 z-50"
      >
        <span>📋</span>
        Audit Log
        {stats.llmCalls > 0 && (
          <span className="bg-white text-purple-600 text-xs font-bold rounded-full px-2 py-0.5">
            {stats.llmCalls}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg">Audit Log</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-purple-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Stats Panel */}
      <div className="p-4 bg-purple-50 border-b border-purple-200">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white p-2 rounded">
            <div className="text-xs text-gray-600">LLM Calls</div>
            <div className="text-lg font-bold text-purple-600">{stats.llmCalls}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="text-xs text-gray-600">Tool Calls</div>
            <div className="text-lg font-bold text-blue-600">{stats.toolCalls}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="text-xs text-gray-600">Errors</div>
            <div className="text-lg font-bold text-red-600">{stats.errors}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="text-xs text-gray-600">Compliance</div>
            <div className={`text-lg font-bold ${isCompliant ? "text-green-600" : "text-red-600"}`}>
              {isCompliant ? "✓ Pass" : "✗ Fail"}
            </div>
          </div>
        </div>

        {/* Unauthorized Mutations Warning */}
        {stats.unauthorizedMutations > 0 && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-2 text-red-900 text-xs">
            <div className="font-bold">⚠️ COMPLIANCE VIOLATION</div>
            <div>{stats.unauthorizedMutations} unauthorized state mutation(s) detected!</div>
          </div>
        )}

        {/* Avg Duration */}
        {stats.averageDuration > 0 && (
          <div className="text-xs text-gray-600 mt-2">
            Avg duration: {stats.averageDuration.toFixed(0)}ms
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex gap-2 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-xs px-2 py-1 rounded border border-gray-300"
        >
          <option value="all">All Entries</option>
          <option value="llm_call">LLM Calls</option>
          <option value="tool_call">Tool Calls</option>
          <option value="error">Errors</option>
        </select>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="text-xs px-2 py-1 rounded border border-gray-300"
        >
          <option value="10">Last 10</option>
          <option value="25">Last 25</option>
          <option value="50">Last 50</option>
          <option value="100">Last 100</option>
        </select>

        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/audit-logs");
              if (response.ok) {
                const data = await response.json();
                const json = JSON.stringify({
                  exportedAt: Date.now(),
                  ...data,
                }, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-log-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            } catch (error) {
              console.error("Failed to export logs:", error);
            }
          }}
          className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-all"
        >
          Export
        </button>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No log entries yet
            <div className="text-xs mt-2 opacity-60">Logs will appear as LLM calls are made</div>
          </div>
        ) : (
          logs.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function LogEntry({ entry }: { entry: AuditLogEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColors = {
    llm_call: "bg-purple-100 border-purple-300 text-purple-900",
    tool_call: "bg-blue-100 border-blue-300 text-blue-900",
    state_mutation: "bg-yellow-100 border-yellow-300 text-yellow-900",
    error: "bg-red-100 border-red-300 text-red-900",
  };

  const typeIcons = {
    llm_call: "🤖",
    tool_call: "🔧",
    state_mutation: "💾",
    error: "⚠️",
  };

  const color = typeColors[entry.type];
  const icon = typeIcons[entry.type];

  return (
    <div className={`border rounded-lg p-2 text-xs ${color}`}>
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-1">
            <span>{icon}</span>
            <span className="capitalize">{entry.type.replace("_", " ")}</span>
          </div>
          {entry.toolName && (
            <div className="text-xs opacity-80">Tool: {entry.toolName}</div>
          )}
          {entry.model && (
            <div className="text-xs opacity-80">Model: {entry.model.split("/").pop()}</div>
          )}
          {entry.error && (
            <div className="text-xs font-semibold mt-1">{entry.error}</div>
          )}
        </div>
        <div className="text-xs opacity-60">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-current opacity-80 space-y-1">
          {entry.prompt && (
            <div>
              <div className="font-semibold">Prompt:</div>
              <div className="text-xs opacity-90">{entry.prompt}</div>
            </div>
          )}
          {entry.toolArgs && (
            <div>
              <div className="font-semibold">Args:</div>
              <pre className="text-xs opacity-90 overflow-x-auto">
                {JSON.stringify(entry.toolArgs, null, 2)}
              </pre>
            </div>
          )}
          {entry.duration && (
            <div>
              <div className="font-semibold">Duration:</div>
              <div className="text-xs opacity-90">{entry.duration}ms</div>
            </div>
          )}
          {entry.source && (
            <div>
              <div className="font-semibold">Source:</div>
              <div className="text-xs opacity-90">{entry.source}</div>
            </div>
          )}
          {entry.stack && (
            <details>
              <summary className="font-semibold cursor-pointer">Stack Trace</summary>
              <pre className="text-xs opacity-90 overflow-x-auto mt-1">
                {entry.stack}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
