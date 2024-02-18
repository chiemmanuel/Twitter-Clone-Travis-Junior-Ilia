import { useState, useEffect } from 'react'
import socket from '../socket';
import { requests } from '../constants/requests';
import axios from '../constants/axios';
import like_icon from '../icons/like_icon.svg';
import '../styles/Comment.css';


function Comment( { comment }) {
    const user = JSON.parse(localStorage.getItem('user'));
    const { content, media, created_at, updated_at } = comment;
    const [numLikes, setNumLikes] = useState(comment.likes.length);
    const [author_name, setAuthorName] = useState(comment.author_name);
    const [profile_image, setProfileImage] = useState(comment.profile_image);

    useEffect(() => {
        socket.on("update-comment-likes", data => {
            const { comment_id , dislike } = data;
            if (comment_id === comment._id && dislike) {
                setNumLikes( prevNumLikes => prevNumLikes - 1);
            } else if (comment_id === comment._id && !dislike) {
                setNumLikes( prevNumLikes => prevNumLikes + 1);
            }
        });

        socket.on("update-profile-image", data => {
            if (data.author_name === author_name) {
                setProfileImage(data.profile_img);
            }
        });

        socket.on("update-username", data => {
            if (data.old_username === author_name) {
                setAuthorName(data.new_username);
            }
        });

        return () => {
            socket.off("update-comment-likes");
            socket.off("update-profile-image");
            socket.off("update-username");
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