# EventForge Agent Skill v2

You are working on an EventForge agent task. Read this skill first, then execute the task exactly.

## Mission

Produce one valid EventForge draft and submit it through the task submission API.

## Required execution flow

1. Read the task payload.
   - Send `GET` to the provided read endpoint.
   - Include header: `Authorization: Bearer <token>`.
2. Inspect the response fields:
   - `task.resourceKind`
   - `task.turnKind`
   - `brief.originalPrompt`
   - `brief.iterationFeedback`
   - `brief.currentDraft`
   - `outputContract`
   - `rules`
3. Build exactly one draft object for the requested `task.resourceKind`.
4. Submit with the required envelope.
   - Send `POST` to the provided submit endpoint.
   - Include header: `Authorization: Bearer <token>`.
   - JSON body must be:

```json
{
  "resourceKind": "question_type | minitool",
  "result": { "...draft fields...": "..." }
}
```

## Turn handling

- `task.turnKind = "create"`:
  - Use `brief.originalPrompt` as the primary source.
  - Produce an initial, complete draft.
- `task.turnKind = "iterate"`:
  - Treat `brief.currentDraft` as the baseline source of truth.
  - Apply only the requested changes from `brief.iterationFeedback`.
  - Keep valid existing behavior unless feedback explicitly asks to change it.

## Global output rules

- The draft must match `outputContract` exactly: correct keys, correct value types.
- Return only the required draft fields inside `result`; no extra metadata.
- Keep all user-facing text in English.
- Do not invent backend APIs, schema fields, imports, or unsupported dependencies.
- Keep code practical and executable; avoid speculative abstractions.
- Follow every item in `rules` from the read payload.

## Runtime safety rules for generated code

- No import statements in generated code strings.
- No TypeScript-only syntax in generated code strings.
- End each generated code block with `render(...)`.
- Guard nullable values before property access.

## Resource contract: question_type

`result` must be:

```json
{
  "suggestedName": "string",
  "formCode": "string",
  "displayCode": "string",
  "answerSchema": {}
}
```

Requirements:

- `formCode`: interactive answering UI.
- `displayCode`: read-only answer display for review/analytics.
- `answerSchema`: JSON shape describing stored answer data.

## Resource contract: minitool

`result` must be:

```json
{
  "suggestedName": "string",
  "componentCode": "string",
  "hostCode": "string"
}
```

Requirements:

- `componentCode`: audience-facing interaction view.
- `hostCode`: host-facing aggregation/control view.
- Host view must reflect participant outcomes for the same task goal.

## Pre-submit checklist

- I used `task.resourceKind` and `task.turnKind` (not guessed fields).
- I followed `rules` and `outputContract` from the read payload.
- My `result` object has exactly the required keys for this resource kind.
- All code fields are plain JS/JSX-compatible and end with `render(...)`.
- All UI copy is English.
- I submitted with envelope `{ resourceKind, result }` to the submit endpoint.
