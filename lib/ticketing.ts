/**
 * Order Ticketing & Queue System
 *
 * Manages the order queue for the café:
 * - Create and track order tickets
 * - Manage queue state (pending, in progress, completed)
 * - Calculate wait times and priorities
 * - Track order history
 */

import type { OrderTicket } from "./function-calling";
import type { DrinkType } from "./types";

// ============================================================================
// QUEUE STATE
// ============================================================================

export interface QueueState {
  tickets: OrderTicket[];
  activeTicketId: string | null;
  completedToday: number;
  totalRevenue: number;
}

/**
 * Create initial queue state
 */
export function createQueueState(): QueueState {
  return {
    tickets: [],
    activeTicketId: null,
    completedToday: 0,
    totalRevenue: 0,
  };
}

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

/**
 * Add a ticket to the queue
 */
export function addTicket(
  state: QueueState,
  ticket: OrderTicket
): QueueState {
  return {
    ...state,
    tickets: [...state.tickets, ticket],
  };
}

/**
 * Get the next pending ticket (respects priority)
 */
export function getNextTicket(state: QueueState): OrderTicket | null {
  // First, check for high priority tickets
  const highPriority = state.tickets.find(
    t => t.status === "pending" && t.priority === "high"
  );
  if (highPriority) return highPriority;

  // Then, get oldest normal priority ticket
  const normalPriority = state.tickets.find(
    t => t.status === "pending" && t.priority === "normal"
  );
  return normalPriority || null;
}

/**
 * Start working on a ticket
 */
export function startTicket(
  state: QueueState,
  ticketId: string
): QueueState {
  return {
    ...state,
    activeTicketId: ticketId,
    tickets: state.tickets.map(t =>
      t.id === ticketId ? { ...t, status: "in_progress" as const } : t
    ),
  };
}

/**
 * Complete a ticket
 */
export function completeTicket(
  state: QueueState,
  ticketId: string,
  payment: number
): QueueState {
  return {
    ...state,
    activeTicketId: state.activeTicketId === ticketId ? null : state.activeTicketId,
    completedToday: state.completedToday + 1,
    totalRevenue: state.totalRevenue + payment,
    tickets: state.tickets.map(t =>
      t.id === ticketId
        ? { ...t, status: "completed" as const, completedAt: Date.now() }
        : t
    ),
  };
}

/**
 * Cancel a ticket
 */
export function cancelTicket(
  state: QueueState,
  ticketId: string
): QueueState {
  return {
    ...state,
    activeTicketId: state.activeTicketId === ticketId ? null : state.activeTicketId,
    tickets: state.tickets.map(t =>
      t.id === ticketId ? { ...t, status: "cancelled" as const } : t
    ),
  };
}

/**
 * Get ticket by ID
 */
export function getTicket(
  state: QueueState,
  ticketId: string
): OrderTicket | null {
  return state.tickets.find(t => t.id === ticketId) || null;
}

/**
 * Get active ticket
 */
export function getActiveTicket(state: QueueState): OrderTicket | null {
  if (!state.activeTicketId) return null;
  return getTicket(state, state.activeTicketId);
}

/**
 * Get all pending tickets
 */
export function getPendingTickets(state: QueueState): OrderTicket[] {
  return state.tickets.filter(t => t.status === "pending");
}

/**
 * Get all completed tickets
 */
export function getCompletedTickets(state: QueueState): OrderTicket[] {
  return state.tickets.filter(t => t.status === "completed");
}

/**
 * Calculate estimated wait time for a ticket (in seconds)
 */
export function getEstimatedWaitTime(
  state: QueueState,
  ticketId: string
): number {
  const ticket = getTicket(state, ticketId);
  if (!ticket || ticket.status !== "pending") return 0;

  // Count tickets ahead in queue
  const pending = getPendingTickets(state);
  const position = pending.findIndex(t => t.id === ticketId);
  if (position === -1) return 0;

  // Estimate time per drink (in seconds)
  const timePerDrink: Record<DrinkType, number> = {
    espresso: 30,
    latte: 60,
    cappuccino: 60,
    pourover: 120,
    aeropress: 90,
    mocha: 90,
    americano: 45,
    matcha: 60,
  };

  // Calculate total wait time based on drinks ahead
  let totalWait = 0;
  for (let i = 0; i < position; i++) {
    const drinkTime = timePerDrink[pending[i].drinkType] || 60;
    totalWait += drinkTime;
  }

  return totalWait;
}

/**
 * Clear completed tickets (typically at end of day)
 */
export function clearCompleted(state: QueueState): QueueState {
  return {
    ...state,
    tickets: state.tickets.filter(t => t.status !== "completed"),
  };
}

/**
 * Reset queue for new day
 */
export function resetQueue(): QueueState {
  return createQueueState();
}

// ============================================================================
// QUEUE STATISTICS
// ============================================================================

export interface QueueStats {
  totalTickets: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  averageWaitTime: number; // in seconds
  totalRevenue: number;
}

/**
 * Get queue statistics
 */
export function getQueueStats(state: QueueState): QueueStats {
  const tickets = state.tickets;
  const completed = getCompletedTickets(state);

  // Calculate average wait time for completed orders
  let totalWaitTime = 0;
  for (const ticket of completed) {
    if (ticket.completedAt) {
      const waitTime = (ticket.completedAt - ticket.createdAt) / 1000;
      totalWaitTime += waitTime;
    }
  }

  const averageWaitTime = completed.length > 0
    ? totalWaitTime / completed.length
    : 0;

  return {
    totalTickets: tickets.length,
    pending: tickets.filter(t => t.status === "pending").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    completed: tickets.filter(t => t.status === "completed").length,
    cancelled: tickets.filter(t => t.status === "cancelled").length,
    averageWaitTime,
    totalRevenue: state.totalRevenue,
  };
}
