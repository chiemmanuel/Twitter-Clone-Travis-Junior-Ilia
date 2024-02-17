import {useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Notification from '../components/Notification'
import {
    fetchNotifications,
    removeNotification,
    updateNotifications,
    selectNotifications,
    selectNotificationsStatus,
    selectNotificationsError,
  } from '../features/Notifications/notificationSlice';
import { useSelector, useDispatch } from 'react-redux';

function NotificationPage() {
    const user = JSON.parse(localStorage.getItem('user'));
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
        let new_unread = notifications.unread;
        let new_read = notifications.read;
        if (notification.isRead) {
           new_unread = new_unread.filter(n => n._id !== notification._id);
           new_read = [notification, ...new_read];

        } else {
           new_read = new_read.filter(n => n._id !== notification._id);
           new_unread = [notification, ...new_unread];
        }
        dispatch(updateNotifications({unread: new_unread, read: new_read}));
    }



  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Notifications</h1>
        <div className='notifications'>
            <div className='unread__notifications'>
                <h2>{notifications.unread.length} Unread Notification(s)</h2>
                {notifications.unread.map(n => <Notification key={n._id} notification_object={n} handleReadOnClick={() => handleReadOnClick(n)} />)}
            </div>
            <div className='read__notifications'>
                <h2>Read</h2>
                {notifications.read.map(n => <Notification key={n._id} notification_object={n} handleReadOnClick={() => handleReadOnClick(n)} />)}
            </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage