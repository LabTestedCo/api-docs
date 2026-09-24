# Reports, corrections, and errors

## Required report fields

| Field | Meaning |
| --- | --- |
| `brand_id`, `product_id`, `variant_id`, `batch_id` | Internal LabTested UUIDs. The batch must belong to that exact product, variant, and brand. |
| `lot_number` | Exact stored lot number. The API rejects mismatches; it never silently creates or selects a different lot. |
| `external_report_id` | Your lab’s stable certificate/report identifier, up to 200 characters. Use a lab-wide unique identifier, including any customer prefix necessary to avoid collisions with other brands or portal submissions. |
| `revision` | Integer, starting at 1. Corrections increment by exactly 1. |
| `upload_id` | Unused original PDF upload for this lab and brand. |
| `test_type` | Description of the test/panel, up to 200 characters. |
| `test_date`, `report_date` | Valid `YYYY-MM-DD` dates; report date cannot precede test date. |
| `approval_signer_name` | Authorized approver’s name, up to 200 characters. |
| `approval_confirmed` | Must be `true`; the lab attests approval. |
| `results` | 1–500 analyte rows, preserving the reported text and units. |

Optional fields: `sample_id` (200 characters), `testing_method` (500), `approval_signer_title` (200), `correction_note` (2,000), and `integrity_confirmed` (boolean, default false). Nullable optional text fields may be omitted or null, but not empty strings. Unknown fields are rejected to catch integration mistakes.

## Analyte rows

Required: `category` (100 characters), `analyte_name` (200), `result_value` (500), and `status`.

Optional nullable text: `unit` (100), `threshold`, `loq`, `method` (500 each), and `notes` (2,000). Values such as `< 0.010`, `ND`, and their original units must remain strings. LOQ is separate from the acceptance threshold. Do not translate a missing value into zero or infer a passing verdict.

Supported statuses: `Pass`, `Fail`, `Not detected`, `Below limit`, `Above limit`, `Detected`, `Not applicable`.

`Detected` and `Not applicable` carry no pass/fail verdict. They can be delivered for review but block the existing public publication flow until resolved. Unknown status strings are rejected. Duplicate analyte names, impossible negative measurements, and recognized contradictions between status and limit are rejected. Integrations remain responsible for the correctness and completeness of the lab’s data.

## Idempotency and retries

Provide `Idempotency-Key` on every report submission: 8–128 ASCII letters, digits, `.`, `_`, `:`, or `-`. Keys are scoped to the lab and survive API credential rotation. A matching replay returns the original receipt even if the report’s current review status has since changed; use GET for current status.

- Same key and same normalized JSON content: original receipt, no duplicate report or notification.
- Same key with different content: `409 idempotency_conflict`.
- Same report/revision under another key: `409 revision_conflict`.
- Timed-out requests, `429`, and `503`: retry with the same body/key, respecting `Retry-After` and using backoff.
- Other 4xx errors: fix the indicated issue before retrying. Use a new key if changing an already-accepted request.

Receipts are retained with their reports rather than expiring after a short retry window. Key order in JSON does not affect matching; result array order does.

## Corrections

The brand first requests a correction in its dashboard. Poll GET `/reports/{id}` for the reason. Then upload the corrected original COA and POST `/reports` with:

- The same external report ID and destination IDs.
- The next consecutive revision.
- A new upload ID and idempotency key.
- The complete corrected metadata/results and a nonempty `correction_note`.

The same LabTested report UUID is retained. Previous files are superseded, source payloads and result history remain recorded, the correction request is resolved, and the brand receives a new review notification. Existing public results are not overwritten until the brand publishes the correction. Arbitrary replacement of already-published reports is not allowed.

If the original destination itself is wrong, contact the brand/LabTested; the correction endpoint does not move a report to another product or lot.

## PDF integrity review

`422 integrity_confirmation_required` means the PDF contains alteration indicators. Inspect the original and confirm it is the authorized lab document. Only then resubmit with `integrity_confirmed: true`. This confirmation is recorded with the source payload; it does not suppress the integrity evidence shown during review.

## Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "Check the request fields.",
    "details": [{ "field": "results.0.status", "message": "Invalid enum value" }],
    "request_id": "correlation-uuid"
  }
}
```

`details` is included for schema validation errors; other errors may omit it. `X-Request-Id` is also returned in the response headers.

| HTTP | Codes / meaning |
| --- | --- |
| 400 | `invalid_json`, `empty_body` |
| 401 | `unauthorized`: missing, invalid, expired, revoked key, or inactive lab |
| 403 | `forbidden`, `insufficient_scope`: connection or permission unavailable |
| 404 | `not_found`: unknown endpoint or scoped resource |
| 409 | `idempotency_conflict`, `revision_conflict`, `correction_not_requested` |
| 413 | `body_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `validation_error`, `invalid_destination`, `invalid_upload`, `invalid_pdf`, `integrity_confirmation_required` |
| 429 | `rate_limited`; wait for `Retry-After` |
| 503 | `temporarily_unavailable`; retry with backoff |
