import { useState } from 'react'
import instance from '../constants/axios'
import { requests } from '../constants/requests'
import User from '../components/User'
import Tweet from '../components/Tweet'

function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const user = JSON.parse(localStorage.getItem('user'))
    console.log(user.token)

    const handleSearch = async () => {
        if (searchQuery.trim() === '') {
            return
        }
        if (searchQuery.startsWith('#')) {
            await instance.get(requests.hashtagSearch + searchQuery.slice(1), {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }).then((res) => {
                console.log(res.data)
                setSearchResults(res.data.results)
            }).catch((err) => {
                console.log(err)
            })
        } else if (searchQuery.startsWith('@')) {
            console.log(searchQuery.slice(1))
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
        <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by username or hashtag'
        />
        <button onClick={handleSearch}>Search</button>
        {searchResults.length > 0 && (
            <div className='search-results'>
            {searchResults.map((result) => {
                if (result.username) {
                return <User key={result._id} username={result.username} displayname={result.username} />
                }
            })}
            </div>
        )}

    </div>
  )
}

export default SearchPage