import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';

import upload_icon from '../icons/upload_icon.svg';
import '../styles/PostCommentForm.css';

const cldUploadApi = "https://api.cloudinary.com/v1_1/dqqel2q07/image/upload";

function PostCommentForm(props) {
    const { tweet_id, tweetAuthorUsername, tweetAuthorEmail } = props
    const user = JSON.parse(localStorage.getItem('user'))
    const [commentText, setCommentText] = useState('')
    const [commentMedia, setCommentMedia] = useState(null)
    const [previewURL, setPreviewURL] = useState(null)
    const [message, setMessage] = useState('')

    const handleCommentSubmit = async (e) => {
      e.preventDefault()
      if (commentText === '' && commentMedia === null) {
        setMessage('Please enter a comment or attach media')
        return
      }
      if (commentText.length > 140) {
        setMessage('Comment is too long')
        return
      } 

      const formData = new FormData();
      formData.append('file', commentMedia);
      formData.append('upload_preset', 'dkp3udd5');

      const res = await fetch(
          cldUploadApi,
          {
              method: 'POST',
              body: formData
          }
      );
      const imgData = await res.json();

      axios.post(requests.postComment + tweet_id, {
        content: commentText,
        media: imgData.url
      }, {
        headers: {
          'Authorization' : `Bearer ${
            user.token
          }`,
        },
      })
      .then((response) => {
        setCommentText('')
        setCommentMedia(null)
        setPreviewURL(null)
        setMessage('')
        console.log(response)
        axios.post(requests.postNotification,{
          recipient_email: tweetAuthorEmail,
          content: `New comment from ${user.username} on your <a href="/view_tweet/${tweet_id}">tweet</a>`
        } , {
          headers: {
            'Authorization' : `Bearer ${
              user.token
            }`,
          },
        })
      })
      .catch((error) => {
        console.error('Error posting comment', error)
      })}



  return (
    <div className='post-comment'>
      <p className='post-comment-author-name'>Replying to {tweetAuthorUsername}</p>
      <form className="post-comment-form" onSubmit={handleCommentSubmit}>
        <textarea
          className="comment-text"
          placeholder="Post your reply"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        {previewURL && <img src={previewURL} alt="preview" className="comment-media-preview" />}
        <div className='comment-form-buttons'>
          <label for="comment-media" className="comment-media-label">
            <img src={upload_icon} alt="upload" className="comment-media-icon" title="Attach an image or gif" />
          </label>
          <input
            type="file"
            id="comment-media"
            onChange={(e) => {
              setCommentMedia(e.target.files[0])
              setPreviewURL(URL.createObjectURL(e.target.files[0]))
            }}
          />
          <button type="submit" className="comment-submit">Post</button>
        </div>
        <p className="comment-message">{message}</p>
      </form>
    </div>
  )
}

export default PostCommentForm