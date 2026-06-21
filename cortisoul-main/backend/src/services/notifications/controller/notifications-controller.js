import InvariantError from '../../../exceptions/invariant-error.js';
import NotFoundError from '../../../exceptions/not-found-error.js';
import response from '../../../utils/response.js';
import notificationRepositories from '../repositories/notification-repositories.js';
import { sendPushNotifications } from '../../../utils/push-helper.js';

export const subscribe = async (req, res, next) => {
  const { endpoint, keys } = req.validated;
  const { id: userId } = req.user;

  const subscriptionId = await notificationRepositories.addSubscription({
    userId,
    endpoint,
    keysP256dh: keys.p256dh,
    keysAuth: keys.auth,
  });

  if (!subscriptionId) {
    return next(new InvariantError('Gagal menambahkan subscription webpush'));
  }

  return response(res, 201, 'Webpush subscription berhasil ditambahkan', {
    subscriptionId,
  });
};

export const unsubscribe = async (req, res, next) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return next(new InvariantError('Endpoint harus disertakan'));
  }

  const deletedId = await notificationRepositories.removeSubscription(endpoint);

  if (!deletedId) {
    return next(new NotFoundError('Webpush subscription tidak ditemukan'));
  }

  return response(res, 200, 'Webpush subscription berhasil dihapus');
};

export const testNotification = async (req, res, next) => {
  const { id: userId } = req.user;

  const subscriptions =
    await notificationRepositories.getSubscriptionsByUserId(userId);

  if (!subscriptions.length) {
    return next(new NotFoundError('No subscription found for this user'));
  }

  const payload = JSON.stringify({
    title: 'Test Notification',
    body: 'This is a test notification from Cortisoul backend',
  });

  const successCount = await sendPushNotifications(subscriptions, payload);

  return response(res, 200, `Notification sent to ${successCount} devices`);
};
