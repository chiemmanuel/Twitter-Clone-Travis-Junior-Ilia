import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Tweet from '../components/Tweet'
import { requests } from '../constants/requests'
import axios from '../constants/axios';
import socket from '../socket';
import PlaceholderComment from '../components/PlaceholderComment';
import Navbar from '../components/Navbar';
import '../styles/TweetPage.css'


const ViewTweetPage = () => {
    const { id } = useParams()
    const user = JSON.parse(localStorage.getItem('user'))
    const [tweet, setTweet] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [comments, setComments] = useState([])

    useEffect(() => {
        axios.get(requests.getTweet + id, {
            headers: {
                'Authorization' : `Bearer ${
                  user.token
                }`,
              },
        })
            .then((response) => {
                setTweet(response.data.tweet)
                setLoading(false)
            })
            .catch((error) => {
                console.error('Error fetching tweet', error)
                setError(true)
                setLoading(false)
            })

        axios.get(requests.getTweetComments + id, {
            headers: {
                'Authorization' : `Bearer ${
                  user.token
                }`,
              },
        })
            .then((response) => {
                setComments(response.data.comments)
            })
            .catch((error) => {
                console.error('Error fetching comments', error)
                setComments([])
            })
        socket.on('comment-added', (data) => {
            console.log('comment', data)
            const newComment = data.comment
            if (newComment.tweet_id === id) {
                setComments(prevComments => [newComment, ...prevComments])
            }})

        return () => {
            socket.off('comment')
        }
    }, [id])




  return (
    <div className='viewtweet'>
        <div className='header'>
            <Navbar />
        </div>
        <div className='main'>
            {loading && <p>Loading...</p>}
            {error && <p>Error fetching tweet</p>}
            <div className='tweet_container'>
            {!loading && !error && <Tweet tweet={tweet} />}
            </div>
            <div className='comments_container'>
            {!loading && !error &&  comments.length > 0 && comments.map((comment) => {
                return <PlaceholderComment key={comment._id} className='comment'/>
            })}
            </div>
        </div>
    </div>
  )
}

export default ViewTweetPage