import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const survey = pgTable(
  "survey",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").default("draft").notNull(),
    slug: text("slug").unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("survey_userId_idx").on(table.userId)],
);

export const question = pgTable(
  "question",
  {
    id: text("id").primaryKey(),
    surveyId: text("survey_id")
      .notNull()
      .references(() => survey.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    required: boolean("required").default(false).notNull(),
    options: jsonb("options").$type<string[] | null>(),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("question_surveyId_idx").on(table.surveyId)],
);

export const response = pgTable(
  "response",
  {
    id: text("id").primaryKey(),
    surveyId: text("survey_id")
      .notNull()
      .references(() => survey.id, { onDelete: "cascade" }),
    answers: jsonb("answers").notNull().$type<Record<string, string | string[]>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("response_surveyId_idx").on(table.surveyId)],
);

export const surveyRelations = relations(survey, ({ one, many }) => ({
  user: one(user, {
    fields: [survey.userId],
    references: [user.id],
  }),
  questions: many(question),
  responses: many(response),
}));

export const questionRelations = relations(question, ({ one }) => ({
  survey: one(survey, {
    fields: [question.surveyId],
    references: [survey.id],
  }),
}));

export const responseRelations = relations(response, ({ one }) => ({
  survey: one(survey, {
    fields: [response.surveyId],
    references: [survey.id],
  }),
}));
