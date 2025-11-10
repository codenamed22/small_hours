/**
 * Tests for Ticketing/Queue System
 */

import { describe, it, expect } from "vitest";
import type { OrderTicket } from "./function-calling";
import {
  createQueueState,
  addTicket,
  getNextTicket,
  startTicket,
  completeTicket,
  cancelTicket,
  getTicket,
  getActiveTicket,
  getPendingTickets,
  getCompletedTickets,
  getEstimatedWaitTime,
  clearCompleted,
  resetQueue,
  getQueueStats,
} from "./ticketing";

// Helper to create a test ticket
function createTestTicket(overrides: Partial<OrderTicket> = {}): OrderTicket {
  return {
    id: `ticket_${Math.random().toString(36).substr(2, 9)}`,
    customerName: "Test Customer",
    drinkType: "latte",
    priority: "normal",
    status: "pending",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("Ticketing System", () => {
  describe("createQueueState", () => {
    it("should create an empty queue", () => {
      const state = createQueueState();

      expect(state.tickets).toHaveLength(0);
      expect(state.activeTicketId).toBeNull();
      expect(state.completedToday).toBe(0);
      expect(state.totalRevenue).toBe(0);
    });
  });

  describe("addTicket", () => {
    it("should add a ticket to the queue", () => {
      const state = createQueueState();
      const ticket = createTestTicket();

      const newState = addTicket(state, ticket);

      expect(newState.tickets).toHaveLength(1);
      expect(newState.tickets[0]).toBe(ticket);
    });

    it("should add multiple tickets", () => {
      let state = createQueueState();
      const ticket1 = createTestTicket({ customerName: "Alex" });
      const ticket2 = createTestTicket({ customerName: "Sam" });

      state = addTicket(state, ticket1);
      state = addTicket(state, ticket2);

      expect(state.tickets).toHaveLength(2);
      expect(state.tickets[0].customerName).toBe("Alex");
      expect(state.tickets[1].customerName).toBe("Sam");
    });
  });

  describe("getNextTicket", () => {
    it("should return null for empty queue", () => {
      const state = createQueueState();
      const next = getNextTicket(state);

      expect(next).toBeNull();
    });

    it("should return the first pending ticket", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      const next = getNextTicket(state);

      expect(next).toBe(ticket);
    });

    it("should prioritize high priority tickets", () => {
      let state = createQueueState();
      const normalTicket = createTestTicket({
        customerName: "Normal",
        priority: "normal",
      });
      const highTicket = createTestTicket({
        customerName: "High",
        priority: "high",
      });

      state = addTicket(state, normalTicket);
      state = addTicket(state, highTicket);

      const next = getNextTicket(state);

      expect(next?.customerName).toBe("High");
    });

    it("should skip in-progress tickets", () => {
      let state = createQueueState();
      const ticket1 = createTestTicket({
        customerName: "First",
        status: "in_progress",
      });
      const ticket2 = createTestTicket({ customerName: "Second" });

      state = addTicket(state, ticket1);
      state = addTicket(state, ticket2);

      const next = getNextTicket(state);

      expect(next?.customerName).toBe("Second");
    });
  });

  describe("startTicket", () => {
    it("should mark a ticket as in progress", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      state = startTicket(state, ticket.id);

      expect(state.activeTicketId).toBe(ticket.id);
      expect(state.tickets[0].status).toBe("in_progress");
    });
  });

  describe("completeTicket", () => {
    it("should mark a ticket as completed", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      state = startTicket(state, ticket.id);
      state = completeTicket(state, ticket.id, 4.5);

      expect(state.tickets[0].status).toBe("completed");
      expect(state.tickets[0].completedAt).toBeDefined();
      expect(state.completedToday).toBe(1);
      expect(state.totalRevenue).toBe(4.5);
      expect(state.activeTicketId).toBeNull();
    });

    it("should accumulate revenue", () => {
      let state = createQueueState();
      const ticket1 = createTestTicket();
      const ticket2 = createTestTicket();

      state = addTicket(state, ticket1);
      state = addTicket(state, ticket2);
      state = completeTicket(state, ticket1.id, 4.0);
      state = completeTicket(state, ticket2.id, 5.0);

      expect(state.completedToday).toBe(2);
      expect(state.totalRevenue).toBe(9.0);
    });
  });

  describe("cancelTicket", () => {
    it("should mark a ticket as cancelled", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      state = cancelTicket(state, ticket.id);

      expect(state.tickets[0].status).toBe("cancelled");
    });
  });

  describe("getTicket", () => {
    it("should find a ticket by ID", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      const found = getTicket(state, ticket.id);

      expect(found).toBe(ticket);
    });

    it("should return null for non-existent ticket", () => {
      const state = createQueueState();
      const found = getTicket(state, "nonexistent");

      expect(found).toBeNull();
    });
  });

  describe("getActiveTicket", () => {
    it("should return the active ticket", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      state = startTicket(state, ticket.id);

      const active = getActiveTicket(state);

      expect(active?.id).toBe(ticket.id);
      expect(active?.status).toBe("in_progress");
    });

    it("should return null when no active ticket", () => {
      const state = createQueueState();
      const active = getActiveTicket(state);

      expect(active).toBeNull();
    });
  });

  describe("getPendingTickets", () => {
    it("should return only pending tickets", () => {
      let state = createQueueState();
      const pending1 = createTestTicket({ status: "pending" });
      const inProgress = createTestTicket({ status: "in_progress" });
      const pending2 = createTestTicket({ status: "pending" });

      state = addTicket(state, pending1);
      state = addTicket(state, inProgress);
      state = addTicket(state, pending2);

      const pendingTickets = getPendingTickets(state);

      expect(pendingTickets).toHaveLength(2);
      expect(pendingTickets[0]).toBe(pending1);
      expect(pendingTickets[1]).toBe(pending2);
    });
  });

  describe("getCompletedTickets", () => {
    it("should return only completed tickets", () => {
      let state = createQueueState();
      const ticket1 = createTestTicket();
      const ticket2 = createTestTicket();

      state = addTicket(state, ticket1);
      state = addTicket(state, ticket2);
      state = completeTicket(state, ticket1.id, 4.5);

      const completed = getCompletedTickets(state);

      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe(ticket1.id);
    });
  });

  describe("getEstimatedWaitTime", () => {
    it("should return 0 for non-pending tickets", () => {
      let state = createQueueState();
      const ticket = createTestTicket({ status: "completed" });

      state = addTicket(state, ticket);
      const waitTime = getEstimatedWaitTime(state, ticket.id);

      expect(waitTime).toBe(0);
    });

    it("should calculate wait time based on position", () => {
      let state = createQueueState();
      const ticket1 = createTestTicket({ drinkType: "espresso" }); // 30s
      const ticket2 = createTestTicket({ drinkType: "latte" }); // 60s
      const ticket3 = createTestTicket({ drinkType: "pourover" }); // 120s

      state = addTicket(state, ticket1);
      state = addTicket(state, ticket2);
      state = addTicket(state, ticket3);

      const waitTime = getEstimatedWaitTime(state, ticket3.id);

      // Should be ticket1 (30s) + ticket2 (60s) = 90s
      expect(waitTime).toBe(90);
    });
  });

  describe("clearCompleted", () => {
    it("should remove completed tickets", () => {
      let state = createQueueState();
      const pending = createTestTicket({ status: "pending" });
      const completed = createTestTicket();

      state = addTicket(state, pending);
      state = addTicket(state, completed);
      state = completeTicket(state, completed.id, 4.5);
      state = clearCompleted(state);

      expect(state.tickets).toHaveLength(1);
      expect(state.tickets[0]).toBe(pending);
    });
  });

  describe("resetQueue", () => {
    it("should create a fresh queue", () => {
      let state = createQueueState();
      const ticket = createTestTicket();

      state = addTicket(state, ticket);
      state = completeTicket(state, ticket.id, 10.0);

      const newState = resetQueue();

      expect(newState.tickets).toHaveLength(0);
      expect(newState.completedToday).toBe(0);
      expect(newState.totalRevenue).toBe(0);
    });
  });

  describe("getQueueStats", () => {
    it("should calculate statistics correctly", () => {
      let state = createQueueState();
      const pending = createTestTicket({ status: "pending" });
      const inProgress = createTestTicket({ status: "in_progress" });
      const completed = createTestTicket({ createdAt: Date.now() - 60000 });
      const cancelled = createTestTicket({ status: "cancelled" });

      state = addTicket(state, pending);
      state = addTicket(state, inProgress);
      state = addTicket(state, completed);
      state = addTicket(state, cancelled);
      state = completeTicket(state, completed.id, 5.0);

      const stats = getQueueStats(state);

      expect(stats.totalTickets).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.totalRevenue).toBe(5.0);
      expect(stats.averageWaitTime).toBeGreaterThan(0);
    });
  });
});
