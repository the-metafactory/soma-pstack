Two merges wait on you, PR 40 and PR 41.

![New export progress page on staging](screenshots/progress.png)

- The invoice export now takes about 6 seconds instead of about 90 on the staging copy. I have not tested it on production data.
- The export runs as a background job instead of the nightly cron, and the tests pass.
- Search for the cause found a missing database index. The reviewer approved the fix but found that failed export jobs retry forever.
- The progress page is new. No screenshot yet of the old page to compare, so only the new one is shown.

I can add the 5-retry limit myself, so that is not a decision for you.

- **D1:** Merge PR 40 "Rename export column headers"? My pick is to hold. It is approved and the tests pass, but it changes the headers customers' scripts read, and nobody has checked whether customers parse them. Risk: customer scripts could break.
- **D2:** Merge PR 41 "Speed up invoice export"? My pick is yes, after I add the 5-retry limit. The speedup was measured, the reviewer approved the index, and the tests pass. Risk: the index locks the invoices table for about 2 seconds on staging, and production has 40 times the rows, so that lock time is unknown.
