# Quickstart

You need a lab key, an active brand connection, and an existing product, variant, and lot. All IDs below are LabTested internal UUIDs returned by lookup endpoints; a `prod_…` public identifier is not a submission UUID.

```sh
export LABTESTED_API_KEY='YOUR_LAB_API_KEY'
export LABTESTED_API_BASE='https://app.labtested.co/api/v1/labs'

curl --fail-with-body "$LABTESTED_API_BASE/connections" \
  -H "Authorization: Bearer $LABTESTED_API_KEY"
```

Choose the `brand_id`, then look up its product and destination:

```sh
curl --fail-with-body "$LABTESTED_API_BASE/products?brand_id=BRAND_UUID" \
  -H "Authorization: Bearer $LABTESTED_API_KEY"
curl --fail-with-body "$LABTESTED_API_BASE/products/PRODUCT_UUID/variants" \
  -H "Authorization: Bearer $LABTESTED_API_KEY"
curl --fail-with-body "$LABTESTED_API_BASE/products/PRODUCT_UUID/batches" \
  -H "Authorization: Bearer $LABTESTED_API_KEY"
```

Upload the original COA as raw PDF bytes (not multipart form data):

```sh
curl --fail-with-body -X POST "$LABTESTED_API_BASE/uploads?brand_id=BRAND_UUID" \
  -H "Authorization: Bearer $LABTESTED_API_KEY" \
  -H 'Content-Type: application/pdf' \
  --data-binary @original-coa.pdf
```

The `201` response contains `upload_id`, `expires_at`, `sha256`, and `size_bytes`. The upload expires after 24 hours if not submitted. An upload can be used only once and only for its lab and brand. An upload alone does not create a report in the brand inbox.

Copy [examples/report.json](examples/report.json) locally. Replace all illustrative IDs and result data with the actual destination, upload ID, and certificate contents. An authorized person’s name and `approval_confirmed: true` attest approval of this report by the lab.

```sh
curl --fail-with-body -X POST "$LABTESTED_API_BASE/reports" \
  -H "Authorization: Bearer $LABTESTED_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: your-system-report-1001-v1' \
  --data-binary @report.json
```

Example receipt (identifiers are illustrative):

```json
{
  "report_id": "00000000-0000-4000-8000-000000000099",
  "external_report_id": "YOUR-LAB-COA-1001",
  "revision": 1,
  "status": "submitted_by_lab",
  "brand_id": "00000000-0000-4000-8000-000000000001"
}
```

Persist this receipt and the exact submitted body/idempotency key in your integration. If a request times out, retry the **same body and key**. A successful replay returns `200`, the original receipt, and `Idempotency-Replayed: true`; first acceptance returns `201`. Do not upload a replacement PDF merely because the submission response was lost.

The report is now in the brand’s Lab submissions inbox with an in-app notification. Poll its current status:

```sh
curl --fail-with-body "$LABTESTED_API_BASE/reports/REPORT_UUID" \
  -H "Authorization: Bearer $LABTESTED_API_KEY"
```

For a runnable retrying client after preparing `report.json`:

```sh
node examples/submit.mjs report.json your-system-report-1001-v1
```
