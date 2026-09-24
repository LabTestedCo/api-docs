# Endpoint reference

All paths are relative to `https://app.labtested.co/api/v1/labs`. Every endpoint requires a lab bearer key. See [OpenAPI](openapi.json) for the machine-readable request contract.

| Method | Path | Scope | Result |
| --- | --- | --- | --- |
| GET | `/connections` | read | Active brand connections: connection `id`, `brand_id`, `organizations.name` |
| GET | `/products?brand_id={uuid}` | read | Non-archived brand catalog entries: `id`, `name`, `public_id`, `gtin` |
| GET | `/products/{id}/variants` | read | Product variants: `id`, `name`, `code`, `is_default` |
| GET | `/products/{id}/batches` | read | Non-archived lots: `id`, `variant_id`, `lot_number` |
| POST | `/uploads?brand_id={uuid}` | submit | Upload raw PDF bytes; returns upload UUID, expiry, SHA-256 and size |
| POST | `/reports` | submit | Deliver a report or brand-requested correction; requires `Idempotency-Key` |
| GET | `/reports/{id}` | read | Current report/review status and open correction requests |

## Pagination

All four collection endpoints accept `page` (default 1, maximum 10,000) and `per_page` (default 50, maximum 100). Follow `next_page` until null. Ordering is stable by internal ID; it is not a creation-date ordering or a transactional snapshot.

```json
{
  "data": [],
  "pagination": { "page": 1, "per_page": 50, "next_page": null }
}
```

## Uploads

`Content-Type: application/pdf`. Maximum body size: 3,145,728 bytes. Returns `201`:

```json
{
  "upload_id": "00000000-0000-4000-8000-000000000005",
  "expires_at": "2026-10-02T12:00:00Z",
  "sha256": "64-character-lowercase-hex-digest",
  "size_bytes": 120000
}
```

The API performs basic PDF completeness checks, verifies the stored checksum before submission, and runs alteration-indicator checks. These are integrity checks, not a guarantee of certificate authenticity or proof that structured results match the PDF.

This endpoint is not idempotent: retrying an upload can create another staging object. Only the upload referenced by the accepted report is attached. Unused uploads expire after 24 hours and are cleaned up periodically. Prefer preserving the returned upload ID.

## Report status

The status response includes `report_id` (LabTested report UUID), `external_report_id` (your lab’s report identifier), `revision`, destination IDs, `status`, `correction_status`, timestamps, and `correction_requests`. Use the LabTested `report_id` in the status URL.

Statuses include `submitted_by_lab`, `brand_review_required`, `correction_requested`, `published`, `hidden`, `rejected`, `archived`, and `expired`. Treat unrecognized future statuses as requiring inspection rather than as success/publication. Only the brand’s review workflow changes public publication state.

Open correction requests expose `id`, `reason`, `note`, `specific_field`, and `created_at`. Results submitted through the human lab portal are not returned by this API’s report-status endpoint.
