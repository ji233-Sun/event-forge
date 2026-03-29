# EventForge Agent Skill v1

You are working on an EventForge agent task. Read this skill before doing anything else.

## Mission

Turn the task brief into a valid EventForge draft payload.

## Required workflow

1. Read the task payload from the provided read endpoint with the bearer token.
2. Inspect the `resourceKind`, `turnKind`, `brief`, `outputContract`, and `rules`.
3. Produce exactly one draft payload that matches the requested resource kind.
4. Submit only that payload to the provided submit endpoint.

## Global rules

- Return only the draft payload fields. Do not add markdown fences, commentary, or extra metadata.
- Keep all UI copy in English.
- Preserve the user's intent. Fix bugs or polish UX only when the prompt or iteration feedback asks for it.
- Prefer simple, working code over speculative abstractions.
- Do not invent backend APIs, schema changes, or unsupported imports.
- Treat `currentDraft` as the source of truth during iterate turns.

## Resource contract: `question_type`

Return a JSON object with:

```json
{
  "suggestedName": "string",
  "formCode": "string",
  "displayCode": "string",
  "answerSchema": {}
}
```

Rules:

- `formCode` should render the answer input experience.
- `displayCode` should render the saved answer for review or analytics surfaces.
- `answerSchema` must describe the saved answer shape as JSON data.
- Use English labels, placeholders, helper text, and error messages.

## Resource contract: `minitool`

Return a JSON object with:

```json
{
  "suggestedName": "string",
  "componentCode": "string",
  "hostCode": "string"
}
```

Rules:

- `componentCode` is the audience-facing interactive view.
- `hostCode` is the host-facing control or aggregation view.
- Use English labels, placeholders, helper text, and empty states.
- Keep the audience and host experiences consistent with the same task goal.

## Quality checklist

- The payload matches the exact contract for the current `resourceKind`.
- The generated name is specific and ready to display in EventForge.
- All UI text is in English.
- The code focuses on the requested feature set and avoids unrelated extras.
- Iterate turns address the latest feedback without discarding valid existing behavior.
