/* eslint-disable camelcase */

export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('webpush_subscriptions', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(30)',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    endpoint: {
      type: 'TEXT',
      notNull: true,
    },
    keys_p256dh: {
      type: 'TEXT',
      notNull: true,
    },
    keys_auth: {
      type: 'TEXT',
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
    },
    updated_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('webpush_subscriptions');
};
