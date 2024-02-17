import { useState } from 'react';
import axios from '../constants/axios';
import { requests } from '../constants/requests';
import ReactModal from 'react-modal';
import Poll from './Poll';
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
        setTweetText(e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        var words = tweetText.split(/[\s#]+/);
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
            closeModal()
            if (retweet) {
                console.log(response)
                axios.post(requests.postNotification, {
                    recipient_email: retweet.author_email,
                    content: `${user.username} <a href="/view_tweet/${response.data._id}">retweeted</a> your tweet "${retweet.content}"`,
                }, {
                    headers: {
                        'Authorization' : `Bearer ${
                            user.token
                        }`,
                    },
                }).then((response) => {
                    console.log(response)
                }).catch((error) => {
                    console.error('Error posting notification', error)
                })
            }
        })
        .catch((error) => {
            console.error('Error posting tweet', error)
        })
    }
        
    return (
        <ReactModal
          isOpen={isOpen}
          onRequestClose={closeModal}
          contentLabel="Post Tweet Modal"
          className="tweet-modal"
          overlayClassName="tweet-modal-overlay"
        >
        <div className='post-tweet-container'>
            <form className="post-tweet-form" onSubmit={handleSubmit}>
                <textarea
                    className="tweet-text"
                    placeholder={isRetweet ? `Retweeting ${retweet.author.username}` : displayPoll ? "Ask a question" :"What's happening?"}
                    value={tweetText}
                    onChange={(e) => handleTweetTextChange(e)}
                />
                {isRetweet ? (
                        <div className="tweet">
                        <div className="tweet__header">
                          <img src={retweet.author.profile_img} alt="profile" />
                          <div className="tweet__headerText">
                            <h3>
                              {retweet.author.username}{" "}
                            </h3>
                            <p>{new Date(retweet.created_at).toUTCString()}</p>
                          </div>
                        </div>
                        <div className="tweet__body">
                          <p>{retweet.content}</p>
                          { retweet.media !== "" && retweet.media !== null && <img src={retweet.media} alt="media" />}
                          {/* if poll exists, render poll component with poll object */}
                          {retweet.poll && <Poll poll_object={retweet.poll} />}
                          {retweet.retweet ? (
                            <div className="tweet__retweet" >
                              <div className="tweet__header">
                                <img src={retweet.retweet_author.profile_img} alt="profile" />
                                <div className="tweet__headerText">
                                  <h3>
                                    {retweet.retweet_author.username}{" "}
                                  </h3>
                                  {new Date(retweet.created_at).toUTCString() !== new Date(retweet.updated_at).toUTCString() ? (
                                      <p>Edited: {new Date(retweet.updated_at).toUTCString()}</p>
                                  ) : (
                                      <p>{new Date(retweet.created_at).toUTCString()}</p>
                                  )
                                  }
                                </div>
                              </div>
                              <div className="tweet__body">
                                <p>{retweet.content}</p>
                                <img src={retweet.media} alt="media" />
                                {retweet.poll && <Poll poll={retweet.poll} />}
                              </div>
                            </div> 
                          ) : null}
                        </div>
                        </div>
                ) : null}
                {displayPoll && (
                    <div className="poll-form">
                        <input
                            type="text"
                            className="poll-title"
                            placeholder="Poll Title"
                            value={pollTitle}
                            onChange={(e) => setPollTitle(e.target.value)}
                        />
                        {pollOptions.length < 2 ? setPollOptions(['', '']) : null}
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
                            min={0}
                            onChange={(e) => setPollHours(e.target.value)}
                        />
                        <label>Minutes</label>
                        <input
                            type="number"
                            className="poll-duration-minutes"
                            placeholder="Minutes"
                            value={pollMinutes}
                            min={0}
                            onChange={(e) => setPollMinutes(e.target.value)}
                        />
                        </div>
                    </div>
                )}
                <div className="tweet-options">
                    <div className="tweet-options-left">
                        <input
                            type="file"
                            className="tweet-media"
                            onChange={(e) => setTweetMedia(e.target.files[0])}
                            disabled={displayPoll}
                        />
                        {!isRetweet && (
                        <button
                            type="button"
                            className="tweet-poll tweet-option"
                            onClick={() => setDisplayPoll(!displayPoll)}
                            disabled={ isRetweet || tweetMedia !== null}
                        >
                            {displayPoll ? 'Remove Poll' : 'Create Poll'}
                        </button>)}
                    </div>
                    <div className="tweet-options-right">
                        <button
                            type="submit"
                            className="tweet-submit tweet-option"
                        >
                            Tweet
                        </button>
                        <button
                        type="button"
                        className="tweet-close tweet-option"
                        onClick={closeModal}
                        >
                            Close
                        </button>
                    </div>
                </div>
                <p className="message">{message}</p>

            </form>
        </div>
        </ReactModal>
  );
}

export default PostTweetForm