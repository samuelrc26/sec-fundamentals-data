# Public SEC fundamentals

Daily cache of public SEC EDGAR Company Facts for NVDA, MSFT, META, AAPL, AMZN and GOOGL. No portfolio, spreadsheet identifier, contact email or access credential is published.

The collector uses the official SEC API with an identifying User-Agent supplied through the repository Actions secret `SEC_USER_AGENT`. Requests are sequential and separated by over one second. A failed request does not overwrite the last successful cache. `fetchedAt` always records the successful original download, not the time a client reads the cache.

Run the `Refresh public SEC fundamentals` workflow manually for the first verification. It is scheduled daily at 04:17 UTC; GitHub schedules may be delayed. Standard public-repository runners are free under GitHub's current policy. Public-repository scheduled workflows can be disabled after inactivity: a client must reject old cache data rather than assume the schedule ran.

`data/latest.json` contains a schema version, download timestamp, six validated company records, SEC accession links and SHA-256 hashes of downloaded raw responses. TTM and historical extraction are implemented in `core.cjs`. The data is public financial reporting, not investment advice or a market quote feed.

If SEC returns 403, inspect the access policy and contact identification. Do not conceal the automated identity or cycle proxies to evade access restrictions.
