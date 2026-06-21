import InvariantError from '../../../exceptions/invariant-error.js';
import NotFoundError from '../../../exceptions/not-found-error.js';
import AuthorizationError from '../../../exceptions/authorization-error.js';
import response from '../../../utils/response.js';
import journalRepositories from '../../journals/repositories/journal-repositories.js';
import reflectionRepositories from '../repositories/reflection-repositories.js';
import { reflectionService } from '../services/reflection-services.js';

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
    return response(res, 200, 'Refleksi sukses ditampilkan', {
      reflection: existingReflection,
    });
  }

  const generatedResult = await reflectionService({
    content,
    emotion,
    stressScore,
    stressCategory,
  });

  if (!generatedResult) {
    return next(new InvariantError('Gagal menghasilkan refleksi dari AI'));
  }

  const newReflection = await reflectionRepositories.addReflection({
    journalId,
    text: generatedResult.teks,
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

  const reflection =
    await reflectionRepositories.getReflectionByJournalId(journalId);

  if (!reflection) {
    return next(new NotFoundError('Refleksi tidak ditemukan'));
  }

  return response(res, 200, 'Refleksi sukses ditampilkan', {
    reflection,
  });
};
