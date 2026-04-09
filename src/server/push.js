import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

async function sendPush(subscription, payload){
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            await db.removeSubscription(subscription);
        } else {
            console.error('Push error:', err);
        }
    }
}