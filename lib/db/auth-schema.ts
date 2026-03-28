import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

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
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("survey_userId_idx").on(table.userId, table.createdAt)],
);

export const customQuestionType = pgTable(
  'custom_question_type',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    prompt: text('prompt').notNull(),
    formCode: text('form_code').notNull(),
    displayCode: text('display_code').notNull(),
    answerSchema: jsonb('answer_schema').notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('custom_question_type_userId_idx').on(table.userId, table.createdAt)],
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
    customTypeId: text('custom_type_id').references(() => customQuestionType.id, { onDelete: 'set null' }),
    formCodeSnapshot: text('form_code_snapshot'),
    displayCodeSnapshot: text('display_code_snapshot'),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("question_surveyId_idx").on(table.surveyId, table.order)],
);

export const response = pgTable(
  "response",
  {
    id: text("id").primaryKey(),
    surveyId: text("survey_id")
      .notNull()
      .references(() => survey.id, { onDelete: "cascade" }),
    answers: jsonb("answers")
      .notNull()
      .$type<Record<string, string | string[] | Record<string, unknown>>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("response_surveyId_idx").on(table.surveyId, table.createdAt)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  surveys: many(survey),
  decks: many(deck),
  mediaGenerations: many(mediaGeneration),
  mediaGenerationVariants: many(mediaGenerationVariant),
  customQuestionTypes: many(customQuestionType),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const mediaGeneration = pgTable(
  "media_generation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brief: text("brief").notNull(),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("media_generation_userId_idx").on(table.userId, table.createdAt)],
);

export const mediaGenerationVariant = pgTable(
  "media_generation_variant",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id")
      .notNull()
      .references(() => mediaGeneration.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    posterPrompt: text("poster_prompt").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    imageDataUrl: text("image_data_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_generation_variant_parentId_idx").on(table.parentId, table.createdAt),
    index("media_generation_variant_userId_idx").on(table.userId, table.createdAt),
  ],
);

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

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
  customQuestionType: one(customQuestionType, {
    fields: [question.customTypeId],
    references: [customQuestionType.id],
  }),
}));

export const responseRelations = relations(response, ({ one }) => ({
  survey: one(survey, {
    fields: [response.surveyId],
    references: [survey.id],
  }),
}));

export const mediaGenerationRelations = relations(mediaGeneration, ({ one, many }) => ({
  user: one(user, {
    fields: [mediaGeneration.userId],
    references: [user.id],
  }),
  variants: many(mediaGenerationVariant),
}));

export const mediaGenerationVariantRelations = relations(mediaGenerationVariant, ({ one }) => ({
  user: one(user, {
    fields: [mediaGenerationVariant.userId],
    references: [user.id],
  }),
  parent: one(mediaGeneration, {
    fields: [mediaGenerationVariant.parentId],
    references: [mediaGeneration.id],
  }),
}));

type ImageSlideJsonb = {
  index: number
  title: string
  imagePrompt: string
  url?: string
}

type TemplateValuesJsonb = {
  themeMode: string
  baseColor: string
  primaryColor: string
  bgStyle: string
  headingFont: string
  bodyFont: string
  cardStyle: string
  borderRadius: string
}

export const deck = pgTable(
  "deck",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    mode: text("mode").notNull().default("marp"),
    markdown: text("markdown"),
    images: jsonb("images").$type<ImageSlideJsonb[] | null>(),
    templateValues: jsonb("template_values").$type<TemplateValuesJsonb | null>(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("deck_userId_idx").on(table.userId, table.createdAt)],
);

export const deckRelations = relations(deck, ({ one }) => ({
  user: one(user, {
    fields: [deck.userId],
    references: [user.id],
  }),
}));

export const customQuestionTypeRelations = relations(customQuestionType, ({ one }) => ({
  user: one(user, {
    fields: [customQuestionType.userId],
    references: [user.id],
  }),
}));
