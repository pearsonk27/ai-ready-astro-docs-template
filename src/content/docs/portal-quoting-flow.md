---
title: "Quoting Flow"
domain: "portal"
tags:
  - "user-journey"
  - "quote"
last_updated: "2026-04-15"
---

## Overview

The portal quoting flow captures applicant details, computes eligible products, and produces a quote package with premium options.

## Rules

A quote session expires after 30 minutes of inactivity and must be restarted with a new session identifier.

All required applicant fields must pass client and server validation before pricing is requested.

A bound quote version cannot be edited; any update creates a new quote revision.

## Examples

A user who pauses input for 35 minutes receives an expired-session response and restarts a quote.

A user who changes vehicle mileage after pricing triggers a new quote revision with recalculated premium.
