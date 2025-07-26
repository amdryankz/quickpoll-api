import { relations } from "drizzle-orm";
import { boolean, pgEnum, pgTable, primaryKey, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRolesEnum = pgEnum('user_roles', ['admin', 'user'])

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').unique().notNull(),
    hashedPassword: text('hashedPassword').notNull(),
    name: varchar('name', { length: 256 }),
    role: userRolesEnum('role').default('user').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date())
})

export const polls = pgTable('polls', {
    id: serial('id').primaryKey(),
    question: text('question').notNull(),
    description: text('description'),
    userId: serial('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date())
})

export const options = pgTable('options', {
    id: serial('id').primaryKey(),
    pollId: serial('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
    text: text('text').notNull()
})

export const votes = pgTable('votes', {
    userId: serial('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    pollId: serial('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
    optionId: serial('option_id').notNull().references(() => options.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    primaryKey({ columns: [table.userId, table.pollId] })
])

export const usersRelations = relations(users, ({ many }) => ({
    polls: many(polls),
    votes: many(votes)
}))

export const pollsRelations = relations(polls, ({ one, many }) => ({
    user: one(users, {
        fields: [polls.userId],
        references: [users.id]
    }),
    options: many(options),
    votes: many(votes)
}))

export const optionsRelations = relations(options, ({ one, many }) => ({
    poll: one(polls, {
        fields: [options.pollId],
        references: [polls.id]
    }),
    votes: many(votes)
}))

export const votesRelations = relations(votes, ({ one }) => ({
    user: one(users, {
        fields: [votes.userId],
        references: [users.id]
    }),
    poll: one(polls, {
        fields: [votes.pollId],
        references: [polls.id]
    }),
    option: one(options, {
        fields: [votes.optionId],
        references: [options.id]
    })
}))