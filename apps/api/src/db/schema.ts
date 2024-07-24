import {relations} from 'drizzle-orm';
import * as d from 'drizzle-orm/pg-core';
import {uuid} from 'drizzle-orm/pg-core';

export const games = d.pgSchema('games');

export const words = games.table('words', {
    id: uuid('id').primaryKey().defaultRandom(),
    word: d.text('word').notNull(),
    length: d.integer('length').notNull(),
    pure: d.boolean('pure').notNull()
});

export const users = games.table('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: d.text('email').unique().notNull(),
    passwordHash: d.text('password_hash').notNull(),
    firstName: d.text('first_name'),
    lastName: d.text('last_name')
});

export const userGame = games.table(
    'userGame',
    {
        userId: d
            .uuid('user_id')
            .references(() => users.id)
            .notNull(),
        gameId: d
            .uuid('game_id')
            .references(() => game.id)
            .notNull(),
        score: d.integer('score')
    },
    t => ({
        pk: d.primaryKey({columns: [t.userId, t.gameId], name: 'userGameId'})
    })
);

export const game = games.table('game', {
    id: uuid('id').primaryKey().defaultRandom(),
    type: d.text('type'),
    maxScore: d.text('max_score'),
    wordCount: d.integer('wordCount')
});

export const gameWords = games.table(
    'gameWords',
    {
        gameId: d
            .uuid('game_id')
            .references(() => game.id)
            .notNull(),
        wordId: d
            .uuid('word_id')
            .references(() => words.id)
            .notNull()
    },
    t => ({
        pk: d.primaryKey({columns: [t.gameId, t.wordId], name: 'gameWordId'})
    })
);

export const userGameWords = games.table(
    'userGameWords',
    {
        gameId: d
            .uuid('userGameId')
            .references(() => game.id)
            .notNull(),
        wordId: d
            .uuid('word_id')
            .references(() => words.id)
            .notNull()
    },
    t => ({
        pk: d.primaryKey({
            columns: [t.gameId, t.wordId],
            name: 'userGameWordId'
        })
    })
);

export const userRelations = relations(users, ({many}) => ({
    userGame: many(userGame)
}));

export const userGameRelations = relations(userGame, ({one}) => ({
    user: one(users, {fields: [userGame.userId], references: [users.id]}),
    game: one(game, {fields: [userGame.gameId], references: [game.id]})
}));

export const userGameWordsRelations = relations(userGameWords, ({one}) => ({
    game: one(game, {
        fields: [userGameWords.gameId],
        references: [game.id]
    }),
    word: one(words, {
        fields: [userGameWords.wordId],
        references: [words.id]
    })
}));

export const wordsRelations = relations(words, ({many}) => ({
    userGameWords: many(userGameWords),
    gameWords: many(gameWords)
}));

export const gameRelations = relations(game, ({many}) => ({
    gameWords: many(gameWords),
    userGame: many(userGame),
    userGameWords: many(gameWords)
}));

export const gameWordsRelations = relations(gameWords, ({one}) => ({
    game: one(game, {
        fields: [gameWords.gameId],
        references: [game.id]
    }),
    word: one(words, {
        fields: [gameWords.wordId],
        references: [words.id]
    })
}));
