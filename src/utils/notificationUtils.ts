const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;

const notificationUtils = {
    enablePushNotifications: async (user: string, listId: string) => {
        if(!VAPID_PUBLIC_KEY){
            return Promise.reject("VAPID key not set")
        }

        const permission = await Notification.requestPermission();
        if(!permission){
            return Promise.reject("Permission request denied")
        }

        const registration = await navigator.serviceWorker.register('/sw.js')

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })

        await fetch(`/api/list/${listId}/save-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, subscription }),
        });

        return Promise.resolve()
    }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export default notificationUtils;