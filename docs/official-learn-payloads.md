# Official Learn Payloads

This app sources exam metadata from Microsoft Learn Catalog API and generates practice questions from official objectives.

## Current endpoint (used now)

- `GET https://learn.microsoft.com/api/catalog/?type=exams,certifications,mergedCertifications&locale=en-us`

Typical exam fields consumed:
- `uid`
- `display_name` (exam code, e.g. `AZ-900`)
- `title`
- `subtitle`
- `url`
- `pdf_download_url`
- `last_modified`
- `study_guide`

Certification/merged certification fields consumed:
- `skills`
- `study_guide`
- `exams` (to map cert objectives to exam UID)

## Planned migration target (June 2026 deprecation path)

Learn Platform API v1 endpoint family:
- Base: `https://learn.microsoft.com/api/v1`
- Version parameter: `api-version=2023-11-01-preview`
- OAuth scope: `https://learn.microsoft.com/.default`

Typical v1 fields to map:
- `examNumber`
- `title`
- `summary`
- `url`
- `pdfUrl`
- `practiceAssessmentUrl`
- `updatedAt`
- `skills`

## Important note

Microsoft does not expose real certification exam item banks via API. The app therefore uses official objectives and metadata to create practice questions.
