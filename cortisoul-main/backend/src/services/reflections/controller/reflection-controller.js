import NotFoundError from '../../../exceptions/not-found-error.js';
import AuthorizationError from '../../../exceptions/authorization-error.js';
import response from '../../../utils/response.js';
import journalRepositories from '../../journals/repositories/journal-repositories.js';
import reflectionRepositories from '../repositories/reflection-repositories.js';
import { reflectionService } from '../services/reflection-services.js';
import { localReflectionService } from '../services/local-reflection-service.js';

const isLegacyUnsafeReflection = (reflection) => {
  const text = reflection?.reflection_text || reflection?.teks_refleksi || '';
  return text.includes('Tulisanmu, "') || text.includes('aku ingin bunuh diri');
};

const repairReflectionIfNeeded = async ({ journal, reflection }) => {
  if (!reflection || !isLegacyUnsafeReflection(reflection)) {
    return reflection;
  }

  const repairedResult = localReflectionService({
    content: journal.content,
    emotion: journal.emotion,
    stressScore: journal.stress_score,
    stressCategory: journal.stress_category,
  });

  return await reflectionRepositories.updateReflectionByJournalId({
    journalId: journal.id,
    text: repairedResult.teks,
  });
};

export const generateReflection = async (req, res, next) => {
  const { id: journalId } = req.params;
  const { id: owner } = req.user;

  const journal = await journalRepositories.getJournalById(journalId);
  if (!journal) {
    return next(new NotFoundError('Jurnal tidak ditemukan'));
  }

  const {
    content,
    emotion,
    stress_score: stressScore,
    stress_category: stressCategory,
  } = journal;

  const isOwner = await journalRepositories.verifyJournalOwner(
    journalId,
    owner
  );

  if (!isOwner) {
    return next(
      new AuthorizationError('Anda tidak berhak mengakses resource ini')
    );
  }

  const existingReflection =
    await reflectionRepositories.getReflectionByJournalId(journalId);
  if (existingReflection) {
    const repairedReflection = await repairReflectionIfNeeded({
      journal,
      reflection: existingReflection,
    });

    return response(res, 200, 'Refleksi sukses ditampilkan', {
      reflection: repairedReflection,
    });
  }

  let generatedResult = await reflectionService({
    content,
    emotion,
    stressScore,
    stressCategory,
  });

  if (!generatedResult) {
    generatedResult = localReflectionService({
      content,
      emotion,
      stressScore,
      stressCategory,
    });
  }

  const newReflection = await reflectionRepositories.addReflection({
    journalId,
    text: generatedResult.teks || generatedResult.reflection_text,
  });

  return response(res, 201, 'Refleksi berhasil digenerate', {
    reflection: newReflection,
  });
};

export const getReflection = async (req, res, next) => {
  const { id: journalId } = req.params;
  const { id: owner } = req.user;

  const journal = await journalRepositories.getJournalById(journalId);

  if (!journal) {
    return next(new NotFoundError('Jurnal tidak ditemukan'));
  }

  const isOwner = await journalRepositories.verifyJournalOwner(
    journalId,
    owner
  );

  if (!isOwner) {
    return next(
      new AuthorizationError('Anda tidak berhak mengakses resource ini')
    );
  }

  let reflection =
    await reflectionRepositories.getReflectionByJournalId(journalId);

  if (!reflection) {
    return next(new NotFoundError('Refleksi tidak ditemukan'));
  }

  reflection = await repairReflectionIfNeeded({ journal, reflection });

  return response(res, 200, 'Refleksi sukses ditampilkan', {
    reflection,
  });
};
