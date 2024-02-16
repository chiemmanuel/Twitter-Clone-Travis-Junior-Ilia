import { useState, useEffect } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';
import ReactModal from 'react-modal';
import Tweet from './Tweet';
import '../styles/PostTweetForm.css';
function PostTweetForm( { retweet, isOpen, setIsOpen } ) {

    ReactModal.setAppElement('body');
    const closeModal = () => setIsOpen(false);
    const isRetweet = retweet ? true : false
    const [tweetText, setTweetText] = useState('')
    const [tweetHashTags, setTweetHashTags] = useState([])
    const [tweetMedia, setTweetMedia] = useState(null)
    const [displayPoll, setDisplayPoll] = useState(false)
    const [pollTitle, setPollTitle] = useState('')
    const [pollOptions, setPollOptions] = useState([])
    const [pollHours, setPollHours] = useState(0)
    const [pollMinutes, setPollMinutes] = useState(0)
    const [message, setMessage] = useState('')
    const user = JSON.parse(localStorage.getItem('user'))

    const handleTweetTextChange = (e) => {
        var words = e.target.value.split(' ')
        // use reduce to split words into two arrays, one for hashtags and one for the rest of the tweet
        var splitWords = words.reduce((acc, word) => {
            if (word[0] === '#') {
                acc.hashtags.push(word)
            } else {
                acc.text.push(word)
            }
            return acc
        }, {hashtags: [],text: []})
        setTweetText(splitWords.text.join(' '))
        setTweetHashTags(splitWords.hashtags)
    }



    const handleSubmit = (e) => {
        e.preventDefault()
        if (tweetText === '' && tweetMedia === null && !displayPoll) {
            setMessage('Please enter a tweet, attach media or create a poll')
            return
        }
        if (tweetText.length > 140) {
            setMessage('Too many characters! Please keep your tweet under 140 characters')
            return
        }
        if (displayPoll && pollTitle === '') {
            setMessage('Please enter a title for your poll')
            return
        }
        if (displayPoll && pollOptions.includes('')) {
            setMessage('All poll options must be filled out')
            return
        }
        if (displayPoll && pollHours + pollMinutes === 0) {
            setMessage('Please enter a duration for your poll')
            return
        }
        axios.post(requests.postTweet, {
            content: tweetText,
            retweet_id: isRetweet ? retweet._id : null,
            media: tweetMedia,
            hashtags: tweetHashTags,
            poll: displayPoll ? {
                title: pollTitle,
                options: pollOptions,
                duration_seconds: (pollHours * 60 + pollMinutes) * 60
            } : null
        }, {
            headers: {
                'Authorization' : `Bearer ${
                    user.token
                }`,
            },
        })
        .then((response) => {
            setTweetText('')
            setTweetMedia(null)
            setTweetHashTags([])
            setDisplayPoll(false)
            setPollTitle('')
            setPollOptions([])
            setPollHours(0)
            setPollMinutes(0)
            setMessage('')
            console.log(response)
            closeModal()
            // navigate('/home')
        })
        .catch((error) => {
            console.error('Error posting tweet', error)
        })
    }
        
    return (
        <ReactModal
          isOpen={isOpen}
          onRequestClose={closeModal}
          contentLabel="Retweet Modal"
          className="retweet-modal"
        >
        <div className='post_tweet_form'>
            <form className="post-tweet-form" onSubmit={handleSubmit}>
                <textarea
                    className="tweet-text"
                    placeholder={isRetweet ? `Retweeting ${retweet.author.username}` : displayPoll ? "Ask a question" :"What's happening?"}
                    value={tweetText}
                    onChange={(e) => handleTweetTextChange(e)}
                />
                {/* {isRetweet && (
                    <Tweet tweet={retweet} />
                )} */}
                {!displayPoll && (
                <input
                    type="file"
                    className="tweet-media"
                    onChange={(e) => setTweetMedia(e.target.files[0])}
                />)}

                {!isRetweet && (
                <button
                    type="button"
                    className="tweet-poll"
                    onClick={() => setDisplayPoll(!displayPoll)}
                    disabled={ isRetweet || tweetMedia !== null}
                >
                    {displayPoll ? 'Remove Poll' : 'Create Poll'}
                </button>)}
                {displayPoll && (
                    <div className="poll-form">
                        <input
                            type="text"
                            className="poll-title"
                            placeholder="Poll Title"
                            value={pollTitle}
                            onChange={(e) => setPollTitle(e.target.value)}
                        />
                        {pollOptions.map((option, index) => (
                            <div key={index} className='poll-option-container'>
                                <input
                                    key={index}
                                    type="text"
                                    className="poll-option"
                                    placeholder={`Option ${index + 1}` + (index < 2 ? ' (Required)' : ' (Optional)')} 
                                    value={option}
                                    onChange={(e) => {
                                        var newOptions = [...pollOptions]
                                        newOptions[index] = e.target.value
                                        setPollOptions(newOptions)
                                    }}
                                />
                                {index >=2 && (<span className='remove-poll-option' onClick={() => {
                                    const newOptions = pollOptions.filter((_, optionIndex) => optionIndex !== index);
                                    setPollOptions(newOptions);
                                }}>X</span>)}

                            </div>
                        ))}
                        {pollOptions.length < 4 ? (
                            <button
                                type="button"
                                className="add-poll-option"
                                onClick={() => setPollOptions([...pollOptions, ''])}
                            >
                                Add Option
                            </button>
                        ) : null}
                        <p>Poll Duration</p>
                        <div className="poll-duration">
                        <label>Hours</label>
                        <input
                            type="number"
                            className="poll-duration-hours"
                            placeholder="Hours"
                            value={pollHours}
                            onChange={(e) => setPollHours(e.target.value)}
                        />
                        <label>Minutes</label>
                        <input
                            type="number"
                            className="poll-duration-minutes"
                            placeholder="Minutes"
                            value={pollMinutes}
                            onChange={(e) => setPollMinutes(e.target.value)}
                        />
                        </div>
                    </div>
                )}
                <button
                    type="submit"
                    className="tweet-submit"
                >
                    Tweet
                </button>
                <p className="message">{message}</p>

            </form>
        </div>
        </ReactModal>
  );
}

export default PostTweetForm