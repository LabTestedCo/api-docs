# Authentication and permissions

Send your key on every request:

```http
Authorization: Bearer lt_lab_YOUR_SECRET
```

Create credentials at [Lab API settings](https://app.labtested.co/lab/settings/api). Only an active lab admin can create or revoke keys. A key can expire in 1–365 days; the default in the UI is 90 days. Its secret is shown once and is stored as a hash by LabTested.

Permissions:

| Scope | Operations |
| --- | --- |
| `read` | Connected brands, product/variant/lot lookup, report status |
| `submit` | PDF uploads and report submissions/corrections |

The key creation screen offers read-only or read-and-submit access. Keys are lab-wide: they can operate only within that lab’s active brand connections. They do not provide general access to a brand account. Existing brand read API keys and public widget keys cannot submit laboratory reports.

Store the key in your server’s secret manager or environment variables. Never put it in browser JavaScript, a mobile app, a URL, GitHub, or a public support issue.

To rotate, create a replacement, update your integration, verify it works, then revoke the previous key. Revoked/expired keys and keys belonging to inactive labs are rejected. A disconnected brand cannot receive new submissions or be read through its former connection.

## Rate limiting

The API allows **120 requests per minute per key**, shared across application instances and all endpoints. Responses after authentication include `X-RateLimit-Limit` and `X-RateLimit-Remaining`. A throttled request returns `429` with `Retry-After` in seconds. Respect that delay and retry with backoff.

Use HTTPS and server-to-server requests. Browser CORS access is not provided. API responses are marked `Cache-Control: no-store`.

## Environments

The documented URL is production. This release does not provide a self-service sandbox. Arrange a designated test lab/brand connection with LabTested before testing writes. Uploading/submitting through production credentials creates real private dashboard records, even though it does not publish them publicly.
