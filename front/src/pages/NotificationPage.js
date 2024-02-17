import {useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Notification from '../components/Notification'
import {
    fetchNotifications,
    removeNotification,
    markAllAsRead,
    markOneAsRead,
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
        console.log('handleReadOnClick', notification);
        dispatch(markOneAsRead(notification._id));
    }

    const handleMarkAllAsRead = () => {
        dispatch(markAllAsRead());
    }



  return (
    <div>
    <div className="header">
      <Navbar />
    </div>
      <div className="main">
        <h1>Notifications</h1>
        <div className='notifications'>
            <div className='unread__notifications'>
                <h2>{notifications.unread.length} Unread Notification(s)</h2>
                <button onClick={handleMarkAllAsRead}>Mark All As Read</button>
                {notifications.unread.map(n => <Notification key={n._id} notification_object={n} handleReadOnClick={() => handleReadOnClick(n)} isRead={false} />)}
            </div>
            <div className='read__notifications'>
                <h2>Read</h2>
                {notifications.read.map(n => <Notification key={n._id} notification_object={n} handleReadOnClick={() => handleReadOnClick(n)} isRead={true} />)}
            </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationPage