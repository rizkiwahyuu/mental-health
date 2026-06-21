/* eslint-disable camelcase */
export const journalToModel = ({
  id,
  title,
  content,
  created_at,
  updated_at,
  stress_score,
  emotion,
  owner,
}) => {
  return {
    id,
    title,
    content,
    created_at,
    updated_at,
    stress_score: parseFloat(stress_score),
    emotion,
    owner,
  };
};
