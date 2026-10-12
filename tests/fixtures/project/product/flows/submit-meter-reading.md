---
id: submit-meter-reading
title: Submit meter reading
status: in-spec
mode: prototype
sections: [meter-readings, account]
patterns: [wizard]
artifacts: []
personas: [cautious-first-timer]
updated: 2026-10-12
---

# Submit meter reading

## Overview
A tenant submits the yearly meter reading, from the reminder email to the confirmation.

## Context
- **User:** Ana (`cautious-first-timer`)
- **Intent:** Submit the reading before the deadline
- **Trigger:** Reminder email
- **Success:** Reading accepted and confirmed
- **User state:** first-time, on mobile

## Rules
- **R1** — Readings below the previous value are rejected
- **R2** — The user must be signed in

## Flow Diagram

```mermaid
flowchart TD
  start(["Start: Reminder email"]) --> S1
  subgraph meter-readings["Meter Readings"]
    S1["S1 · Open reading form"] --> S2{"S2 · Signed in?"}
    S3["S3 · Enter reading"] --> S4["S4 · Review reading"]
    S4 --> S5["S5 · Confirmation"]
  end
  S2 -- "yes" --> S3
  S2 -- "no" --> S3
  S5 --> S6["S6 · Receive email"]
  S6 --> done(["Success: Reading confirmed"])
  S3 -. "value too low" .-> E1["E1 · Explain the rule"]
  E1 --> S3

  classDef error fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
  class E1 error
```

## Steps

| # | Step | User action | System response | State | Section / Screen | Rules |
|---|------|-------------|-----------------|-------|------------------|-------|
| S1 | Open reading form | Taps the link in the email | Shows the form | `idle` | `meter-readings` / `ReadingForm` | — |
| S2 | Signed in? | Signs in if needed | Checks the session | `auth` | `account` / `Login` | R2 |
| S3 | Enter reading | Types the value | Validates inline | `editing` | `meter-readings` / `ReadingForm` | R1 |
| S4 | Review reading | Checks the value | Shows a summary | `review` | `meter-readings` / `ReadingReview` | — |
| S5 | Confirmation | Reads the confirmation | Shows success | `done` | `meter-readings` / `ReadingConfirmation` | — |
| S6 | Receive email | — | Sends a confirmation email | `done` | — | — |

## Edge Cases

| # | Failure | Trigger | Handling | Returns to |
|---|---------|---------|----------|-----------|
| E1 | Value too low | Reading below the previous value | Explain the rule and keep the input | S3 |

## Prototype Mapping

| Step | Section | Screen design | Status | Missing |
|------|---------|---------------|--------|---------|
| S1 | `meter-readings` | `ReadingForm` | exists | — |
| S2 | `account` | `Login` | exists | — |
| S3 | `meter-readings` | `ReadingForm` | partial | inline error state |
| S4 | `meter-readings` | `ReadingReview` | exists | — |
| S5 | `meter-readings` | `ReadingConfirmation` | exists | — |
| S6 | — | — | gap | email template |

## Open Questions
- [ ] Is a photo upload required?
