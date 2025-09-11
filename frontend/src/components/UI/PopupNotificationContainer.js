import React from 'react';
import PopupNotification from './PopupNotification';
import { usePopupNotification } from '../../contexts/PopupNotificationContext';

const PopupNotificationContainer = () => {
  const { notifications, removeNotification } = usePopupNotification();

  console.log('🎨 PopupNotificationContainer render:', { 
    notificationsCount: notifications.length,
    notifications: notifications,
    hasNotifications: notifications.length > 0
  });

  return (
    <>
      {notifications.map((notification) => {
        console.log('🎭 Rendering popup notification:', notification);
        return (
          <PopupNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        );
      })}
    </>
  );
};

export default PopupNotificationContainer;
