import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import playersReducer from './slices/playersSlice'
import matchesReducer from './slices/matchesSlice'
import notificationsReducer from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    players: playersReducer,
    matches: matchesReducer,
    notifications: notificationsReducer,
  },
})
