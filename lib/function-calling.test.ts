/**
 * Tests for Function Calling System
 */

import { describe, it, expect } from "vitest";
import {
  parseOrder,
  createTicket,
  checkAllergens,
  completeOrder,
  executeFunctionCall,
} from "./function-calling";

describe("Function Calling System", () => {
  describe("parseOrder", () => {
    it("should parse a basic order", () => {
      const result = parseOrder({
        drink_type: "latte",
      });

      expect(result.drinkType).toBe("latte");
    });

    it("should parse an order with milk preference", () => {
      const result = parseOrder({
        drink_type: "latte",
        milk_type: "oat",
      });

      expect(result.drinkType).toBe("latte");
      expect(result.milkType).toBe("oat");
    });

    it("should parse an order with temperature preference", () => {
      const result = parseOrder({
        drink_type: "cappuccino",
        temperature_preference: "extra_hot",
      });

      expect(result.drinkType).toBe("cappuccino");
      expect(result.temperaturePreference).toBe("extra_hot");
    });

    it("should parse an order with special requests", () => {
      const result = parseOrder({
        drink_type: "latte",
        special_requests: ["no foam", "extra shot"],
      });

      expect(result.drinkType).toBe("latte");
      expect(result.specialRequests).toEqual(["no foam", "extra shot"]);
    });

    it("should parse an order with urgency", () => {
      const result = parseOrder({
        drink_type: "espresso",
        urgency: "rushed",
      });

      expect(result.drinkType).toBe("espresso");
      expect(result.urgency).toBe("rushed");
    });

    it("should throw error for invalid drink type", () => {
      expect(() => {
        parseOrder({
          drink_type: "invalid_drink",
        });
      }).toThrow("Invalid drink type: invalid_drink");
    });
  });

  describe("createTicket", () => {
    it("should create a basic ticket", () => {
      const ticket = createTicket({
        customer_name: "Alex",
        drink_type: "latte",
      });

      expect(ticket.customerName).toBe("Alex");
      expect(ticket.drinkType).toBe("latte");
      expect(ticket.status).toBe("pending");
      expect(ticket.priority).toBe("normal");
      expect(ticket.id).toMatch(/^ticket_/);
    });

    it("should create a ticket with milk preference", () => {
      const ticket = createTicket({
        customer_name: "Sam",
        drink_type: "cappuccino",
        milk_type: "almond",
      });

      expect(ticket.milkType).toBe("almond");
    });

    it("should create a ticket with notes", () => {
      const ticket = createTicket({
        customer_name: "Jordan",
        drink_type: "latte",
        notes: "Extra hot, no foam",
      });

      expect(ticket.notes).toBe("Extra hot, no foam");
    });

    it("should create a high priority ticket", () => {
      const ticket = createTicket({
        customer_name: "Taylor",
        drink_type: "espresso",
        priority: "high",
      });

      expect(ticket.priority).toBe("high");
    });

    it("should throw error for invalid drink type", () => {
      expect(() => {
        createTicket({
          customer_name: "Alex",
          drink_type: "invalid_drink",
        });
      }).toThrow("Invalid drink type: invalid_drink");
    });
  });

  describe("checkAllergens", () => {
    it("should pass safety check when no allergens", () => {
      const result = checkAllergens({
        drink_type: "latte",
        milk_type: "whole",
        customer_allergens: [],
      });

      expect(result.safe).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it("should fail safety check for dairy allergy with whole milk", () => {
      const result = checkAllergens({
        drink_type: "latte",
        milk_type: "whole",
        customer_allergens: ["dairy"],
      });

      expect(result.safe).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers[0]).toContain("dairy");
    });

    it("should pass safety check for dairy allergy with oat milk", () => {
      const result = checkAllergens({
        drink_type: "latte",
        milk_type: "oat",
        customer_allergens: ["dairy"],
      });

      expect(result.safe).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it("should fail safety check for nut allergy with almond milk", () => {
      const result = checkAllergens({
        drink_type: "latte",
        milk_type: "almond",
        customer_allergens: ["nuts"],
      });

      expect(result.safe).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers[0]).toContain("nuts");
    });

    it("should warn about milk requirement for espresso drinks", () => {
      const result = checkAllergens({
        drink_type: "latte",
        customer_allergens: ["dairy"],
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle espresso without milk issues", () => {
      const result = checkAllergens({
        drink_type: "espresso",
        customer_allergens: ["dairy"],
      });

      expect(result.safe).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });
  });

  describe("completeOrder", () => {
    it("should calculate completion for excellent drink", () => {
      const result = completeOrder({
        ticket_id: "ticket_123",
        drink_quality: 95,
      });

      expect(result.ticketId).toBe("ticket_123");
      expect(result.drinkQuality).toBe(95);
      expect(result.customerSatisfaction).toBeGreaterThanOrEqual(90);
      expect(result.tip).toBeGreaterThan(0);
    });

    it("should calculate completion for good drink", () => {
      const result = completeOrder({
        ticket_id: "ticket_456",
        drink_quality: 80,
      });

      expect(result.drinkQuality).toBe(80);
      expect(result.customerSatisfaction).toBeGreaterThanOrEqual(70);
      expect(result.tip).toBeGreaterThanOrEqual(0);
    });

    it("should calculate completion for poor drink", () => {
      const result = completeOrder({
        ticket_id: "ticket_789",
        drink_quality: 40,
      });

      expect(result.drinkQuality).toBe(40);
      expect(result.customerSatisfaction).toBeLessThan(70);
      expect(result.tip).toBe(0);
    });

    it("should clamp quality to 0-100 range", () => {
      const resultHigh = completeOrder({
        ticket_id: "ticket_high",
        drink_quality: 150,
      });
      expect(resultHigh.drinkQuality).toBe(100);

      const resultLow = completeOrder({
        ticket_id: "ticket_low",
        drink_quality: -50,
      });
      expect(resultLow.drinkQuality).toBe(0);
    });
  });

  describe("executeFunctionCall", () => {
    it("should execute parse_order", () => {
      const result = executeFunctionCall("parse_order", {
        drink_type: "latte",
      });

      expect(result).toHaveProperty("drinkType", "latte");
    });

    it("should execute create_ticket", () => {
      const result = executeFunctionCall("create_ticket", {
        customer_name: "Alex",
        drink_type: "espresso",
      });

      expect(result).toHaveProperty("customerName", "Alex");
      expect(result).toHaveProperty("drinkType", "espresso");
    });

    it("should execute check_allergens", () => {
      const result = executeFunctionCall("check_allergens", {
        drink_type: "latte",
        milk_type: "whole",
        customer_allergens: [],
      });

      expect(result).toHaveProperty("safe");
    });

    it("should execute complete_order", () => {
      const result = executeFunctionCall("complete_order", {
        ticket_id: "ticket_123",
        drink_quality: 90,
      });

      expect(result).toHaveProperty("ticketId", "ticket_123");
    });

    it("should throw error for unknown function", () => {
      expect(() => {
        executeFunctionCall("unknown_function", {});
      }).toThrow("Unknown function: unknown_function");
    });
  });
});
