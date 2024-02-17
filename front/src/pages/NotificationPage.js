import {useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Notification from '../components/Notification'
import {
    fetchNotifications,
    removeNotification,
    markAllAsRead,
    markOneAsRead,
    selectNotifications,
    removeAllRead,
    selectNotificationsStatus,
    selectNotificationsError,
  } from '../features/Notifications/notificationSlice';
import { useSelector, useDispatch } from 'react-redux';

import '../styles/NotificationPage.css';

function NotificationPage() {
    const dispatch = useDispatch();
    const notificationsStatus = useSelector(selectNotificationsStatus);
    const notifications = useSelector(selectNotifications);
    console.log('notifications', notifications);

    useEffect(() => {
        if (notificationsStatus === 'idle') {
            dispatch(fetchNotifications());
        }
    }, [notificationsStatus, dispatch]);

    const handleReadOnClick = (notification) => {
        console.log('handleReadOnClick', notification);
        dispatch(markOneAsRead(notification._id));
    }

    const handleMarkAllAsRead = () => {
        dispatch(markAllAsRead());
    }

    const handleRemoveAllRead = () => {
        dispatch(removeAllRead());
    }

    const handleRemoveNotification = (notification_id, isRead) => {
        dispatch(removeNotification({notification_id, isRead}));
    }



  return (
    <div className='page'>
    <div className="header">
      <Navbar />
    </div>
      <div className="main">
        <h1>Notifications</h1>
        <div className='notifications'>
            <div className='unread__notifications'>
                <div className='notifications__header'>
                <h2>{notifications.unread.length} Unread Notification(s)</h2>
                <button onClick={handleMarkAllAsRead}>Mark All As Read</button>
            </div>
                {notifications.unread.map(n => <Notification key={n._id} notification_object={n} handleReadOnClick={() => handleReadOnClick(n)} isRead={false} handleRemoveOnClick={() => handleRemoveNotification(n._id, false)} />)}
            </div>
            <div className='read__notifications'>
                <div className='notifications__header'>
                <h2>Read</h2>
                <button onClick={handleRemoveAllRead}>Clear all</button>
            </div>
                {notifications.read.map(n => <Notification key={n._id} notification_object={n} handleReadOnClick={() => handleReadOnClick(n)} isRead={true} handleRemoveOnClick={() => handleRemoveNotification(n._id, true)} />)}
            </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage