import React from 'react'
import '../styles/Notification.css';


function Notification({notification_object, handleReadOnClick, isRead, handleRemoveOnClick}) {
    const { content, created_at } = notification_object; 

  return (
    <div className={isRead ? "read notification" : "notification"}>
        <div className="notification__content">
        <p dangerouslySetInnerHTML={{ __html: content }} />            
        <p className='notification__timestamp'>{new Date(created_at).toUTCString()}</p>
        <div className="notification__buttons">
          <div className='mark_as_read'>
          {!isRead && (<button className='mark_as_read_button' onClick={() => handleReadOnClick(notification_object)}>Mark as Read</button>)}
          </div>
          <div className='delete_div'>
          <button className='delete_button' onClick={() => handleRemoveOnClick(notification_object._id, isRead)}>X</button>
          </div>
        </div>
        </div>
    </div>
  )
}

export default Notification