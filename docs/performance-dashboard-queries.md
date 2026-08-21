# Dashboard and schedule query benchmark

Measured on August 21, 2026 against the development database with a
transactional benchmark dataset of:

- 250 students
- 20 instructor identities, each represented across all 5 schools
- 5 schools
- 30,000 flights
- 15,000 reservations

The benchmark executes the same SQL shapes as `listFlights` and
`listReservations`, seven times per query, before and after the composite
indexes. Generated rows and indexes live only in transaction-scoped temporary
tables, so the benchmark never changes or locks the application tables.

| Query | Before p50 | After p50 | Change | Before p95 | After p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Student flight history | 0.62 ms | 0.61 ms | Effectively unchanged | 1.61 ms | 1.48 ms |
| School flight dashboard | 29.56 ms | 27.90 ms | 5.6% faster | 35.02 ms | 33.70 ms |
| CFI flight history | 9.88 ms | 7.03 ms | 28.9% faster | 11.10 ms | 7.40 ms |
| School instructor flights | 2.22 ms | 1.44 ms | 35.1% faster | 2.35 ms | 2.52 ms |
| Instructor schedule | 1.19 ms | 0.04 ms | 96.4% faster | 1.42 ms | 0.15 ms |
| Student schedule | 0.92 ms | 0.02 ms | 97.9% faster | 0.96 ms | 0.03 ms |

Student flight history was already fast with the previous single-column
student index at this volume. Its replacement composite index retains that
performance while matching the date ordering used by the query. CFI history
also benefits from an instructor-specific index. The largest improvements are
on schedules, where PostgreSQL switches from sequential scan plus sort to an
index scan.

Run the benchmark again with:

```sh
npm run benchmark:dashboard
```

The script refuses to run in a deployment and requires a development or
staging `DATABASE_URL`.