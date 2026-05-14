# Azure Certification Practice Trainer

Purpose: provide a controlled practice environment for Azure certification preparation using official Microsoft Learn objectives as source material.

Supported tracks:
- AZ-900 (Fundamentals)
- AZ-104 (Administrator)
- AZ-305 (Solutions Architect)

## Scope

This project provides:
- Timed multi-level practice sessions
- Objective-aligned question sets
- Score and domain breakdowns
- Review flow for answered questions
- Local synchronization of official exam metadata

This project does not provide real certification exam item banks.

## Technical Stack

- React 19
- Vite 8
- JavaScript (ESM)
- CSS

## Setup

```bash
npm install
npm run sync:official
npm run dev
```

## Commands

- `npm run dev` — start development server
- `npm run build` — create production build
- `npm run preview` — preview build output
- `npm run lint` — run static checks
- `npm run sync:official` — refresh official exam metadata and regenerate local question data

## Data Flow

`sync:official` writes:

- `src/data/officialExams.json`
  - normalized official metadata for AZ-900, AZ-104, AZ-305
- `src/data/generatedQuestionBank.json`
  - locally generated practice questions derived from official objectives

Sync script:
- `scripts/sync-official-learn-data.mjs`

Question generation:
- `src/data/generateQuestionsFromObjectives.js`

Payload reference:
- `docs/official-learn-payloads.md`

## Compliance

Certification exam content is confidential. This repository uses public objective metadata and generates independent practice content.

## Repository Layout

```text
scripts/
  sync-official-learn-data.mjs
src/
  App.jsx
  App.css
  data/
    generateQuestionsFromObjectives.js
    officialExams.json
    generatedQuestionBank.json
docs/
  official-learn-payloads.md
```
