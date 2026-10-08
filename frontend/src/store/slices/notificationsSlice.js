import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (unreadOnly = false, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/notifications', {
        params: unreadOnly ? { unreadOnly: 'true' } : {},
      })
      return data // { message, unread, data: [] }
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const markRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      return id
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed')
    }
  }
)

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all')
      return true
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed')
    }
  }
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.items = a.payload.data
        s.unread = a.payload.unread
        s.status = 'succeeded'
      })
      .addCase(markRead.fulfilled, (s, a) => {
        s.items = s.items.map((n) => (n._id === a.payload ? { ...n, read: true } : n))
        s.unread = Math.max(0, s.unread - 1)
      })
      .addCase(markAllRead.fulfilled, (s) => {
        s.items = s.items.map((n) => ({ ...n, read: true }))
        s.unread = 0
      })
  },
})

export default notificationsSlice.reducer
