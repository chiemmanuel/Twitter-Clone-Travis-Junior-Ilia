import React from 'react'
import '../styles/Notification.css';


function Notification({notification_object, handleReadOnClick, isRead}) {
    const { content, created_at } = notification_object; 

  return (
    <div className={isRead ? "read notification" : "notification"}>
        <div className="notification__content">
        <p dangerouslySetInnerHTML={{ __html: content }} />            
        <p className='notification__timestamp'>{new Date(created_at).toUTCString()}</p>
          {!isRead && (<button onClick={() => handleReadOnClick(notification_object)}>Mark as Read</button>)}
        </div>
    </div>
  )
}

export default Notification