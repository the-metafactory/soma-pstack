Two merges wait on you, and I recommend holding both.

![Staging screenshot of the new export progress page](screenshots/progress.png)

- The invoice export now runs as a queue job, and on staging it takes about 6 seconds instead of 90. A missing index was the cause.
- Tests pass.
- The review approved the index but found that the job retries forever on failure.

I can still cap the retries at 5 myself.

- **D1:** Merge PR 40, "Rename export column headers"? Pick: hold. It renames CSV headers that customers' scripts read, and nobody has checked whether they parse them. Risk: customer scripts could break.
- **D2:** Merge PR 41, "Speed up invoice export"? Pick: hold until someone estimates the production lock. The migration locked invoices for 2 seconds on staging, and production has 40 times the rows. Risk: unknown lock time.
