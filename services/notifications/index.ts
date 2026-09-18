export {
  requestPushPermission,
  getFcmToken,
  deleteFcmToken,
  onTokenRefresh,
  onForegroundMessage,
  onNotificationOpened,
  getInitialNotification,
  toPushMessage,
  currentDeviceType,
  currentDeviceName,
  registerBackgroundHandler,
} from "./messaging";

export {
  registerDeviceToken,
  registerForPushNotifications,
  unregisterForPushNotifications,
} from "./register";
