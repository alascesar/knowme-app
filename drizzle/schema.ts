import { pgEnum, pgTable, uuid, text, boolean, timestamp, bigint, unique, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enum for user type
export const userTypeEnum = pgEnum('user_type_enum', ['STANDARD', 'PREMIUM']);

// Users table (extends auth.users)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  type: userTypeEnum('type').notNull().default('STANDARD'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}));

// Profile cards table
export const profileCards = pgTable('profile_cards', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  pronunciationAudioUrl: text('pronunciation_audio_url'),
  phoneticText: text('phonetic_text'),
  photoUrl: text('photo_url'),
  shortBio: text('short_bio'),
  nationality: text('nationality'),
  funFact: text('fun_fact'),
  links: text('links').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_profile_cards_user_id').on(table.userId),
}));

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPublic: boolean('is_public').notNull().default(false),
  joinCode: text('join_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdByUserIdIdx: index('idx_groups_created_by_user_id').on(table.createdByUserId),
  joinCodeIdx: index('idx_groups_join_code').on(table.joinCode),
}));

// Memberships table
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  groupUserUnique: unique('memberships_group_id_user_id_unique').on(table.groupId, table.userId),
  groupIdIdx: index('idx_memberships_group_id').on(table.groupId),
  userIdIdx: index('idx_memberships_user_id').on(table.userId),
}));

// Card statuses table
export const cardStatuses = pgTable('card_statuses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  viewerUserId: uuid('viewer_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileCardId: uuid('profile_card_id').notNull().references(() => profileCards.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  isKnown: boolean('is_known').notNull().default(false),
  lastReviewedAt: bigint('last_reviewed_at', { mode: 'number' }).notNull(),
}, (table) => ({
  viewerProfileGroupUnique: unique('card_statuses_viewer_user_id_profile_card_id_group_id_unique').on(
    table.viewerUserId,
    table.profileCardId,
    table.groupId
  ),
  viewerUserIdIdx: index('idx_card_statuses_viewer_user_id').on(table.viewerUserId),
  profileCardIdIdx: index('idx_card_statuses_profile_card_id').on(table.profileCardId),
  groupIdIdx: index('idx_card_statuses_group_id').on(table.groupId),
}));

// Invitations table
export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  invitedAt: bigint('invited_at', { mode: 'number' }).notNull(),
});

// Relations (optional, for easier querying with joins)
export const usersRelations = relations(users, ({ one, many }) => ({
  profileCard: one(profileCards, {
    fields: [users.id],
    references: [profileCards.userId],
  }),
  createdGroups: many(groups),
  memberships: many(memberships),
  cardStatuses: many(cardStatuses),
}));

export const profileCardsRelations = relations(profileCards, ({ one, many }) => ({
  user: one(users, {
    fields: [profileCards.userId],
    references: [users.id],
  }),
  cardStatuses: many(cardStatuses),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdByUserId],
    references: [users.id],
  }),
  memberships: many(memberships),
  cardStatuses: many(cardStatuses),
  invitations: many(invitations),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  group: one(groups, {
    fields: [memberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const cardStatusesRelations = relations(cardStatuses, ({ one }) => ({
  viewer: one(users, {
    fields: [cardStatuses.viewerUserId],
    references: [users.id],
  }),
  profileCard: one(profileCards, {
    fields: [cardStatuses.profileCardId],
    references: [profileCards.id],
  }),
  group: one(groups, {
    fields: [cardStatuses.groupId],
    references: [groups.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  group: one(groups, {
    fields: [invitations.groupId],
    references: [groups.id],
  }),
}));

