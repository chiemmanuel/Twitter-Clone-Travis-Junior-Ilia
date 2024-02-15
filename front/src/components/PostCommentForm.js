import { useState, useEffect } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';
import '../styles/PostCommentForm.css';


function PostCommentForm(props) {
    const { tweet_id, tweet_author } = props
    const user = JSON.parse(localStorage.getItem('user'))
    const [commentText, setCommentText] = useState('')
    const [commentMedia, setCommentMedia] = useState(null)
    const [message, setMessage] = useState('')

    const handleCommentSubmit = (e) => {
      e.preventDefault()
      if (commentText === '' && commentMedia === null) {
        setMessage('Please enter a comment or attach media')
        return
      }
      if (commentText.length > 140) {
        setMessage('Comment is too long')
        return
      }
      axios.post(requests.postComment + tweet_id, {
        content: commentText,
        media: commentMedia
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
        setMessage('')
        console.log(response)
      })
      .catch((error) => {
        console.error('Error posting comment', error)
      })}



  return (
    <div className='post-comment'>
      <p className='post-comment-author-name'>Replying to {tweet_author}</p>
      <form className="post-comment-form" onSubmit={handleCommentSubmit}>
        <textarea
          className="comment-text"
          placeholder="Post your reply"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <input
          type="file"
          className="comment-media"
          onChange={(e) => setCommentMedia(e.target.files[0])}
        />
        <button type="submit" className="comment-submit">Post</button>
        <p className="comment-message">{message}</p>
      </form>
    </div>
  )
}

export default PostCommentForm