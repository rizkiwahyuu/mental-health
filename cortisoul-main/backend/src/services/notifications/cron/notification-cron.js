import cron from 'node-cron';
import notificationRepositories from '../repositories/notification-repositories.js';
import { sendPushNotifications } from '../../../utils/push-helper.js';
import logger from '../../../config/logger.js';

const sendDailyNotifications = async () => {
  try {
    const subscriptions = await notificationRepositories.getAllSubscriptions();

    if (!subscriptions) {
      logger.info('[Cron] No user is subscribed to receive notifications');
      return;
    }

    const payload = JSON.stringify({
      title: 'Time for Daily Journal!',
      body: "How are you feeling today? Let's fill in your daily journal on Cortisoul.",
    });

    const successCount = await sendPushNotifications(subscriptions, payload);

    logger.info(
      `[Cron] Successfully sent daily notifications to ${successCount} out of ${subscriptions.length} devices`
    );
  } catch (error) {
    logger.error('[Cron] Error running notification schedule: %o', error);
  }
};

// Menjalankan tugas setiap hari pada jam 21:00
const startCronJob = () => {
  cron.schedule(
    '0 21 * * *',
    () => {
      sendDailyNotifications();
    },
    {
      scheduled: true,
      timezone: 'Asia/Jakarta',
    }
  );
};

export default startCronJob;
