import {
	pgTable,
	pgEnum,
	uuid,
	text,
	timestamp,
	jsonb,
	integer,
	boolean,
	decimal,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';

// ENUMS
export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'viewer']);
export const accountTypeEnum = pgEnum('account_type', [
	'checking',
	'savings',
	'credit_card',
	'cash',
	'investment',
	'loan'
]);
export const categoryTypeEnum = pgEnum('category_type', [
	'immediate_obligations',
	'true_expenses',
	'quality_of_life',
	'just_for_fun',
	'income'
]);

// TABLES
export const families = pgTable('families', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	settings: jsonb('settings').default({
		currency: 'USD',
		date_format: 'MM/DD/YYYY',
		start_of_week: 0,
		timezone: 'UTC'
	})
});

export const users = pgTable('users', {
	id: uuid('id').primaryKey(), // This will reference auth.users(id)
	familyId: uuid('family_id').references(() => families.id, { onDelete: 'cascade' }),
	email: text('email').notNull(),
	role: userRoleEnum('role').default('member'),
	displayName: text('display_name'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow()
});

export const accounts = pgTable('accounts', {
	id: uuid('id').defaultRandom().primaryKey(),
	familyId: uuid('family_id')
		.references(() => families.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	type: accountTypeEnum('type').notNull(),
	balance: decimal('balance', { precision: 15, scale: 2 }).default('0.00'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	familyId: uuid('family_id')
		.references(() => families.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	type: categoryTypeEnum('type').notNull(),
	color: text('color').default('#6366f1'),
	priorityOrder: integer('priority_order').default(0),
	isActive: boolean('is_active').default(true),
	parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' })
});

export const transactions = pgTable('transactions', {
	id: uuid('id').defaultRandom().primaryKey(),
	familyId: uuid('family_id')
		.references(() => families.id, { onDelete: 'cascade' })
		.notNull(),
	accountId: uuid('account_id')
		.references(() => accounts.id, { onDelete: 'cascade' })
		.notNull(),
	categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
	description: text('description').notNull(),
	memo: text('memo'),
	isCleared: boolean('is_cleared').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const goals = pgTable('goals', {
	id: uuid('id').defaultRandom().primaryKey(),
	familyId: uuid('family_id')
		.references(() => families.id, { onDelete: 'cascade' })
		.notNull(),
	categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
	targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
	deadline: timestamp('deadline', { withTimezone: true }),
	progress: decimal('progress', { precision: 15, scale: 2 }).default('0.00'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdateFn(() => new Date())
});
