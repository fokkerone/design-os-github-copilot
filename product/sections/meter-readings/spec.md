# Meter Readings Specification

## Overview
Tenants submit a meter reading, check it, get a confirmation and browse the history of past readings.

## User Flows
- Submit meter reading — reminder to confirmation (flow: submit-meter-reading)
- Browse reading history — check the status of past readings (flow: browse-history)

## Personas
- Ana — The cautious first-timer (persona: cautious-first-timer)
- Marta — The busy property manager (persona: property-manager)

## UI Requirements
- The form shows the previous reading and checks the new value inline
- A picture of the meter marks which digits count
- A review step shows the entered value again before sending
- The confirmation shows the value, the date and a reference number
- The history lists every reading with its status and the reason when rejected
- Empty history shows a short hint instead of an empty table
