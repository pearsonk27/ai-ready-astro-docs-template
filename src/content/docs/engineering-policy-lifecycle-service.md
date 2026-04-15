---
title: "Policy Lifecycle Service"
domain: "engineering"
tags:
  - "service-design"
  - "state-machine"
last_updated: "2026-04-15"
---

## Overview

The Policy Lifecycle Service evaluates policy state transitions based on billing, underwriting, and compliance events.

## Rules

The service accepts only versioned event contracts and rejects unknown event schemas with a 400 response.

State transitions are idempotent by policy identifier and transition key to prevent duplicate status updates during retries.

All transition decisions are persisted with event correlation identifiers for deterministic replay.

## Examples

A duplicate PAYMENT_POSTED event with the same transition key is acknowledged and does not create a second ACTIVE transition.

A POLICY_REINSTATE event for a CANCELLED policy is accepted only when billing balance is zero and underwriting hold is false.
