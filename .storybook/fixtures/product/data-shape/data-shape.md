# Data Shape

## Entities

### Tenant
A person who rents a flat and submits readings.

### Meter
A gas, water or electricity meter in a flat.

### Reading
A value read from a meter at a point in time, with an optional photo.

## Relationships

- Tenant has many Meters
- Meter has many Readings
- Reading belongs to Meter
