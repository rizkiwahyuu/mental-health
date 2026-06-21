import webpush from 'web-push';
import notificationRepositories from '../services/notifications/repositories/notification-repositories.js';
import logger from '../config/logger.js';

// VAPID details configuration
try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} catch {
  logger.warn('VAPID details belum lengkap, pastikan .env terisi dengan benar');
}

/**
 * Mengirim notifikasi ke daftar subscriptions
 * @param {Array} subscriptions - Array of subscription objects dari database
 * @param {string} payload - Stringified JSON payload
 * @returns {number} successCount - Jumlah notifikasi yang berhasil terkirim
 */
export const sendPushNotifications = async (subscriptions, payload) => {
  let successCount = 0;

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys_p256dh,
        auth: sub.keys_auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
      successCount++;
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription already invalid
        await notificationRepositories.removeSubscription(sub.endpoint);
      } else {
        logger.error(
          'Error sending push notification to: %s %o',
          sub.endpoint,
          error
        );
      }
    }
  }

  return successCount;
};
