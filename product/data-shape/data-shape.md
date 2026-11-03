# Data Shape

## Entities

### Tenant
A person who rents a flat and submits readings. Has a name, an email address and a language.

### Meter
A physical meter in a flat, for example electricity, water or gas. Has a type, a serial number and a location.

### Reading
One value of a meter at a date, submitted by a tenant. Has a value, a unit, a date and a status (submitted, accepted, rejected).

### Reminder
The email that asks a tenant to submit readings before a deadline. Has a deadline and a sent date.

## Relationships

- Tenant has many Meter
- Meter has many Reading
- Reading belongs to Tenant
- Reminder belongs to Tenant
