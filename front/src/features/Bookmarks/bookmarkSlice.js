import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../constants/axios';
import { requests } from '../../constants/requests';

const initialState = {
    bookmarks: [],
    bookmarked_tweets: [],
    status: 'idle',
    error: null,
};

export const fetchBookmarks = createAsyncThunk('bookmarks/fetchBookmarks', async () => {
    const token = JSON.parse(localStorage.getItem('user')).token;
    const response = await axios.get(requests.getBookmarks, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
});

export const bookmarkSlice = createSlice({
    name: 'bookmarks',
    initialState,
    reducers: {
        addBookmark: (state, action) => {
            state.bookmarks.push(action.payload._id);
            state.bookmarked_tweets.push(action.payload);
        },
        removeBookmark: (state, action) => {
            state.bookmarks = state.bookmarks.filter(bookmark => bookmark !== action.payload);
            state.bookmarked_tweets = state.bookmarked_tweets.filter(tweet => tweet._id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBookmarks.pending, (state, action) => {
                state.status = 'loading';
            })
            .addCase(fetchBookmarks.fulfilled, (state, action) => {
                state.status = 'succeeded';
                console.log('fetchBookmarks', action.payload);
                state.bookmarks = action.payload.bookmarks;
                state.bookmarked_tweets = action.payload.bookmarked_tweets;
            })
            .addCase(fetchBookmarks.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
        },
});

export default bookmarkSlice.reducer;
export const { addBookmark, removeBookmark } = bookmarkSlice.actions;
export const selectBookmarks = state => state.bookmarks.bookmarks;
export const selectBookmarkedTweets = state => state.bookmarks.bookmarked_tweets;
export const selectBookmarksStatus = state => state.bookmarks.status;
export const selectBookmarksError = state => state.bookmarks.error;


