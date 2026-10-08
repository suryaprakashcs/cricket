import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// GET /api/players?role=&playerRole= — any logged-in user
export const fetchPlayers = createAsyncThunk(
  'players/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = {}
      if (filters.role) params.role = filters.role
      if (filters.playerRole) params.playerRole = filters.playerRole
      const { data } = await api.get('/players', { params })
      return data // { message, count, data: [] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch squad')
    }
  }
)

export const fetchPlayerById = createAsyncThunk(
  'players/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/players/${id}`)
      return data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Player not found')
    }
  }
)

// POST /api/players — admin only
export const createPlayer = createAsyncThunk(
  'players/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/players', payload)
      return data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add player')
    }
  }
)

// PUT /api/players/:id — owner or admin
export const updatePlayer = createAsyncThunk(
  'players/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/players/${id}`, updates)
      return data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed')
    }
  }
)

// DELETE /api/players/:id — admin only
export const deletePlayer = createAsyncThunk(
  'players/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/players/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed')
    }
  }
)

// PATCH /api/players/:id/role { role } — admin only
export const updatePlayerRole = createAsyncThunk(
  'players/updateRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/players/${id}/role`, { role })
      return data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Role update failed')
    }
  }
)

const playersSlice = createSlice({
  name: 'players',
  initialState: {
    list: [],
    count: 0,
    selected: null,
    status: 'idle',
    error: null,
    filters: { role: '', playerRole: '', search: '' },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearSelected(state) {
      state.selected = null
    },
    clearPlayersError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayers.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(fetchPlayers.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.list = a.payload.data
        s.count = a.payload.count
      })
      .addCase(fetchPlayers.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload })
      .addCase(fetchPlayerById.fulfilled, (s, a) => { s.selected = a.payload })
      .addCase(fetchPlayerById.rejected, (s, a) => { s.error = a.payload })
      .addCase(createPlayer.fulfilled, (s, a) => { s.list.unshift(a.payload); s.count += 1 })
      .addCase(createPlayer.rejected, (s, a) => { s.error = a.payload })
      .addCase(updatePlayer.fulfilled, (s, a) => {
        s.list = s.list.map((p) => (p._id === a.payload._id ? a.payload : p))
        if (s.selected?._id === a.payload._id) s.selected = a.payload
      })
      .addCase(updatePlayer.rejected, (s, a) => { s.error = a.payload })
      .addCase(deletePlayer.fulfilled, (s, a) => {
        s.list = s.list.filter((p) => p._id !== a.payload)
        s.count -= 1
      })
      .addCase(deletePlayer.rejected, (s, a) => { s.error = a.payload })
      .addCase(updatePlayerRole.fulfilled, (s, a) => {
        s.list = s.list.map((p) => (p._id === a.payload._id ? a.payload : p))
        if (s.selected?._id === a.payload._id) s.selected = a.payload
      })
      .addCase(updatePlayerRole.rejected, (s, a) => { s.error = a.payload })
  },
})

export const { setFilters, clearSelected, clearPlayersError } = playersSlice.actions
export default playersSlice.reducer
