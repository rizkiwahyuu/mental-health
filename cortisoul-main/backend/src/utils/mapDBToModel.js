/* eslint-disable camelcase */
export const journalToModel = ({
  id,
  title,
  content,
  created_at,
  updated_at,
  stress_score,
  stress_category,
  emotion,
  owner,
}) => {
  return {
    id,
    title,
    content,
    created_at,
    updated_at,
    stress_score: stress_score === null ? null : parseFloat(stress_score),
    stress_category,
    emotion,
    owner,
  };
};
