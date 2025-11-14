import { auditLog } from "@/lib/audit-log";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as any;
    const source = searchParams.get("source") as any;
    const limit = searchParams.get("limit");

    const logs = auditLog.getLogs({
      type: type || undefined,
      source: source || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    const stats = auditLog.getStats();

    return NextResponse.json({
      logs,
      stats,
      isCompliant: auditLog.isCompliant(),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch audit logs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    auditLog.clearLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing audit logs:", error);
    return NextResponse.json(
      {
        error: "Failed to clear audit logs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
