import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// POST /api/auth/register — public, but role assignment only works with admin token
export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', payload)
      return data // { message, token, data: player }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
    }
  }
)

// POST /api/auth/login { phoneNumber, password }
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ phoneNumber, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { phoneNumber, password })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Invalid credentials')
    }
  }
)

// GET /api/auth/me (protect)
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

const initialState = {
  user: JSON.parse(localStorage.getItem('cricsquad_user') || 'null'),
  token: localStorage.getItem('cricsquad_token') || null,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
      localStorage.removeItem('cricsquad_token')
      localStorage.removeItem('cricsquad_user')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.token = a.payload.token
        s.user = a.payload.data
        localStorage.setItem('cricsquad_token', a.payload.token)
        localStorage.setItem('cricsquad_user', JSON.stringify(a.payload.data))
      })
      .addCase(registerUser.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload })
      .addCase(loginUser.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.token = a.payload.token
        s.user = a.payload.data
        localStorage.setItem('cricsquad_token', a.payload.token)
        localStorage.setItem('cricsquad_user', JSON.stringify(a.payload.data))
      })
      .addCase(loginUser.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload })
      .addCase(fetchMe.pending, (s) => { s.status = 'loading' })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.user = a.payload
        localStorage.setItem('cricsquad_user', JSON.stringify(a.payload))
      })
      .addCase(fetchMe.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.payload
        // token invalid -> force logout
        if (a.payload?.toLowerCase().includes('expired') || a.payload?.toLowerCase().includes('authorized')) {
          s.user = null; s.token = null
          localStorage.removeItem('cricsquad_token')
          localStorage.removeItem('cricsquad_user')
        }
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
