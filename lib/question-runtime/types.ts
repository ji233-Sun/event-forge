// Represents one field in an AI-generated custom question
export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'slider'
  | 'radio'
  | 'checkbox'
  | 'boolean'

// The JSON Schema stored in DB for server-side answer validation
export type AnswerJsonSchema = {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

// What the AI generation endpoint returns
export type GenerateCustomTypeResult = {
  suggestedName: string
  formCode: string       // JSX string, noInline=true format
  displayCode: string    // JSX string, noInline=true format
  answerSchema: AnswerJsonSchema
}

// A row from the customQuestionType table
export type CustomQuestionType = {
  id: string
  userId: string
  name: string
  description: string | null
  prompt: string
  formCode: string
  displayCode: string
  answerSchema: AnswerJsonSchema
  createdAt: Date
  updatedAt: Date
}
