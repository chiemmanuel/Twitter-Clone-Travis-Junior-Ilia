import { useState, useEffect } from 'react'
import socket from '../socket';
import { requests } from '../constants/requests';
import axios from '../constants/axios';

import like_icon from '../icons/like_icon.svg';
import '../styles/Comment.css';


function Comment( { comment }) {
    const user = JSON.parse(localStorage.getItem('user'));
    const { author_name, profile_image, content, media, created_at, updated_at } = comment;
    const [numLikes, setNumLikes] = useState(comment.likes.length);

    useEffect(() => {
        socket.on("update-comment-likes", data => {
            const { comment_id , dislike } = data;
            if (comment_id === comment._id && dislike) {
                setNumLikes( prevNumLikes => prevNumLikes - 1);
            } else if (comment_id === comment._id && !dislike) {
                setNumLikes( prevNumLikes => prevNumLikes + 1);
            }
        });

        return () => {
            socket.off("update-comment-likes");
        }
        }, [comment._id, user._id]);

    const handleLike = () => {
        axios.post(requests.likeComment + comment._id, {}, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        })
        .then(res => {
            console.log(res.data);
        })
        .catch(err => {
            console.log(err);
        });
    }

    
  return (
    <div className="comment">
        <div className="comment__author">
            <img src={profile_image} alt="profile" />
            <h4>{author_name}</h4>
        </div>
        <div className="comment__content">
            <p>{content}</p>
            {media && <img src={media} alt="media" />}
        </div>
        <span className="comment__likes">
            <img src={like_icon} alt="like" onClick={handleLike} />
            <span>{numLikes}</span>
        </span>
        <div className="comment__footer">
            <p>{new Date(created_at).toUTCString()}</p>
            {new Date(created_at).toUTCString() !== new Date(updated_at).toUTCString() ? (
                <p>Edited: {new Date(updated_at).toUTCString()}</p>
            ) : (
                null
            )}
        </div>
    </div>
  )
}

export default Comment