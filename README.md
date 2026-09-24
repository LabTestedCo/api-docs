# LabTested Lab API

Deliver original laboratory COAs and structured results directly into connected brands’ LabTested dashboards.

**Release status:** v1 is deployed and available for pilot onboarding. Arrange a pilot with LabTested before sending routine production reports; the first end-to-end lab integration is still pending.

The API delivers reports for brand review. It does **not** publish results automatically to storefronts or public product pages.

- Base URL: `https://app.labtested.co/api/v1/labs`
- [Quickstart](quickstart.md)
- [Authentication and permissions](authentication.md)
- [Endpoint reference](endpoints.md)
- [Report format, corrections, and errors](reports.md)
- [OpenAPI 3.1 specification](openapi.json)
- [Example report](examples/report.json)
- [Node.js submission client](examples/submit.mjs)

## Before connecting

1. Have an active LabTested lab account and an active connection approved by the brand.
2. Have the brand create the destination product, variant, and lot in LabTested. Use the lookup endpoints to obtain their IDs. This release does not create products or lots.
3. A lab admin creates an API key in **Lab Settings → API integration**.
4. Map the exact product, variant, and lot in your software; never match by product name alone.
5. Submit the original PDF and the results as reported by the laboratory, including the approver’s identity.

## What v1 supports

- Paginated connected-brand, product, variant, and lot lookup.
- Original PDF upload (maximum **3 MiB / 3,145,728 bytes** per file).
- Up to 500 structured analyte rows per report; a 512 KiB JSON request limit.
- Idempotent report submission and a durable receipt.
- Status polling and brand-requested corrections with revision history.
- Expiring, revocable lab credentials; read-only keys are also available.

One PDF is attached to each report revision. For larger COAs, supporting attachments, or unusual reporting formats, use the lab portal and contact LabTested before automating. Do not compress or alter an original certificate in a way that changes its content.

Orders, automatic public publication, outbound webhooks, automatic product creation, and provider-specific synchronization (including pulling from Light Labs) are not part of this API version. This repository contains documentation and examples, not the private LabTested application.

## Support

For integration help, contact [hello@labtested.co](mailto:hello@labtested.co) and include the `X-Request-Id` from the response. Do not send API secrets. Use private support for report or customer data; GitHub issues are public.
