import * as d from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';

export const words = d.pgTable('words', {
  id: uuid('id').primaryKey().defaultRandom(),
  word: d.text('word').notNull(),
  length: d.integer('length').notNull(),
  pure: d.boolean('pure').notNull(),
});

export const users = d.pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: d.text('email').unique().notNull(),
  passwordHash: d.text('password_hash').notNull(),
  firstName: d.text('first_name'),
  lastName: d.text('last_name'),
});

export const panagramGames = d.pgTable('panagram_games', {
  id: uuid('id').primaryKey().defaultRandom(),
  letters: d.text('letters').notNull(),
  centerLetter: d.text('center_letter').notNull(),
  foundWordsJson: d.text('found_words_json').notNull().default('[]'),
  score: d.integer('score').notNull().default(0),
  completed: d.boolean('completed').notNull().default(false),
  createdAt: d.text('created_at').notNull().default(''),
  updatedAt: d.text('updated_at').notNull().default(''),
});

export const targetGames = d.pgTable('target_games', {
  id: uuid('id').primaryKey().defaultRandom(),
  letters: d.text('letters').notNull(),
  centerLetter: d.text('center_letter').notNull(),
  letterCounts: d.text('letter_counts').notNull(),
  foundWordsJson: d.text('found_words_json').notNull().default('[]'),
  completed: d.boolean('completed').notNull().default(false),
  createdAt: d.text('created_at').notNull().default(''),
  updatedAt: d.text('updated_at').notNull().default(''),
});
