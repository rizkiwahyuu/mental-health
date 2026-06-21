/* eslint-disable camelcase */
export const up = (pgm) => {
  pgm.createTable('journals', {
    id: {
      type: 'VARCHAR(30)',
      primaryKey: true,
      notNull: true,
    },
    title: {
      type: 'TEXT',
      notNull: true,
    },
    content: {
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
    stress_score: {
      type: 'numeric(3, 1)',
      notNull: false,
    },
    emotion: {
      type: 'TEXT',
      notNull: false,
    },
    owner: {
      type: 'VARCHAR(30)',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    stress_category: {
      type: 'TEXT',
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('journals');
};
