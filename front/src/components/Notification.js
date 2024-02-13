import React from 'react'
import '../styles/Notification.css';


function Notification(notification_object) {
    const { _id, recipient_email, content, created_at, updated_at } = notification_object; 
    const [isRead, setIsRead] = useState(notification_object.isRead);

    const handleReadOnClick = () => {
        setIsRead(true);
    }

  return (
    <div className={isRead ? "read notification" : "notification"}>
        <div classname="notification__content">
            <p>{content}</p>
            <p>{new Date(created_at).toUTCString()}</p>
            <button onClick={handleReadOnClick}>Mark as Read</button>
        </div>
    </div>
  )
}

export default Notification