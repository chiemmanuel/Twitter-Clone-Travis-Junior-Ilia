import { configureStore } from '@reduxjs/toolkit';
import bookmarkSlice from '../features/Bookmarks/bookmarkSlice';
import notificationSlice from '../features/Notifications/notificationSlice';

export default configureStore({
    reducer: {
        bookmarks: bookmarkSlice,
        notifications: notificationSlice,
    },
    });
    