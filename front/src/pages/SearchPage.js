import { useEffect, useState } from 'react'
import instance from '../constants/axios'
import { requests } from '../constants/requests'
import { useNavigate } from 'react-router-dom'
import User from '../components/User'
import Tweet from '../components/Tweet'
import Navbar from '../components/Navbar'
import '../styles/SearchPage.css'

function SearchPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [tweetResult, setTweetResult] = useState(false)
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    setTweetResult(false)
    handleSearch()
  }, [searchQuery])

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      return
    }
    if (searchQuery.startsWith('#')) {
      if (searchQuery.length < 2 || searchQuery.slice(1) === ' ') {
        return
      }
      await instance.get(requests.hashtagSearch + searchQuery.slice(1), {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }).then((res) => {
        console.log(res.data)
        setTweetResult(true)
        setSearchResults(res.data.results)
      }).catch((err) => {
        console.log(err)
      })
    } else if (searchQuery.startsWith('@')) {
      if (searchQuery.length < 2 || searchQuery.slice(1) === ' ') {
        return
      }
      await instance.get(requests.userSearch + searchQuery.slice(1), {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }).then((res) => {
        console.log(res.data)
        setSearchResults(res.data.results)
      }).catch((err) => {
        console.log(err)
      })
    } else {
      await instance.get(requests.userSearch + searchQuery, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      }).then((res) => {
        console.log(res.data)
        setSearchResults(res.data.results)
      }).catch((err) => {
        console.log(err)
      })
    }
  }
  return (
    <div className='search-page'>
      <div className='header'>
        <Navbar />
      </div>
      <div className='main'>
        <div className='search-bar'>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by @username or #hashtag'
          />
          {/* <button onClick={handleSearch}>Search</button> */}
        </div>
        {searchResults.length > 0 && !tweetResult ? (
          <div className='user-results'>
            {searchResults.map((result) => {
              if (result.username) {
                return (
                  <div className='user-result' onClick={() => navigate(`/profile/${result.username}`)}>
                    <User key={result._id} user={{ email: result.email, username: result.username, profile_img: result.profile_img }} />
                  </div>
                )
              }
            })}
          </div>
        ) : !tweetResult ? (
          <div className='no-results'>
            No results found
          </div>

        ) : null}
        {tweetResult && searchResults.mostViewedTweets.length > 0 && searchResults.mostRecentTweets.length > 0 ? (
          <div className='tweet-results'>
            <div className='most-viewed-tweets'>
              <h2>Most viewed tweets</h2>
              {searchResults.mostViewedTweets.map((result) => {
                return (
                  <div className='tweet-result' onClick={() => navigate(`/view_tweet/${result._id}`)}>
                    <Tweet key={result._id} tweet={result} />
                  </div>
                )
              })}
            </div>
            <div className='most-recent-tweets'>
              <h2>Most recent tweets</h2>
              {searchResults.mostRecentTweets.map((result) => {
                return (
                  <div className='tweet-result' onClick={() => navigate(`/view_tweet/${result._id}`)}>
                    <Tweet key={result._id} tweet={result} />
                  </div>
                )
              })}
            </div>
          </div>
        ) : tweetResult ? (
          <div className='no-results'>
            No tweet results found
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SearchPage;
