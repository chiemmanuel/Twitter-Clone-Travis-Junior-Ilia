import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../constants/axios';
import { requests } from '../../constants/requests';

const initialState = {
    notifications: {read: [], unread: []},
    status: 'idle',
    error: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async () => {
    const token = JSON.parse(localStorage.getItem('user')).token;
    const response = await axios.get(requests.getNotifications, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log('fetchNotifications', response.data);
    return response.data;
});

export const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            console.log('addNotification', action.payload);
            if (!state.notifications.unread.includes(action.payload._id)) {
                state.notifications.unread.push(action.payload);
            }
        },
        removeNotification: (state, action) => {
            if (state.notifications.unread.includes(action.payload)) {
            state.notifications.unread = state.notifications.unread.filter(notification => notification !== action.payload);
            } else {
            state.notifications.read = state.notifications.read.filter(notification => notification !== action.payload);
            }
        },
        updateNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        markAllAsRead: (state, action) => {
            state.notifications.read = [...state.notifications.unread, ...state.notifications.read];
            state.notifications.unread = [];
        },
        markOneAsRead: (state, action) => {
            let index_to_update = state.notifications.unread.findIndex(n => n._id === action.payload);
            state.notifications.read.unshift(state.notifications.unread[index_to_update]);
            state.notifications.unread = state.notifications.unread.filter((n, index) => index !== index_to_update);
        }


    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state, action) => {
                state.status = 'loading';
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.notifications = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
        },
});

export default notificationSlice.reducer;
export const { addNotification, removeNotification, markAllAsRead, markOneAsRead } = notificationSlice.actions;
export const selectNotifications = state => state.notifications.notifications;
export const selectNotificationsStatus = state => state.notifications.status;
export const selectNotificationsError = state => state.notifications.error;