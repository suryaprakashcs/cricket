import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const err = (e, fallback) => e.response?.data?.message || fallback

export const fetchMatches = createAsyncThunk(
  'matches/fetchAll',
  async (filter = 'upcoming', { rejectWithValue }) => {
    try {
      const { data } = await api.get('/matches', { params: { filter } })
      return data
    } catch (e) {
      return rejectWithValue(err(e, 'Failed to fetch matches'))
    }
  }
)

// Loads match + grouped availability together for the detail view
export const fetchMatchDetail = createAsyncThunk(
  'matches/fetchDetail',
  async (id, { rejectWithValue }) => {
    try {
      const [matchRes, availRes] = await Promise.all([
        api.get(`/matches/${id}`),
        api.get(`/matches/${id}/availability`),
      ])
      return { match: matchRes.data.data, availability: availRes.data.data }
    } catch (e) {
      return rejectWithValue(err(e, 'Match not found'))
    }
  }
)

export const createMatch = createAsyncThunk(
  'matches/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/matches', payload)
      return data
    } catch (e) {
      return rejectWithValue(err(e, 'Failed to create match'))
    }
  }
)

export const updateMatch = createAsyncThunk(
  'matches/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/matches/${id}`, updates)
      return data.data
    } catch (e) {
      return rejectWithValue(err(e, 'Update failed'))
    }
  }
)

export const cancelMatch = createAsyncThunk(
  'matches/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/matches/${id}/cancel`)
      return data.data
    } catch (e) {
      return rejectWithValue(err(e, 'Cancel failed'))
    }
  }
)

// Player responds Available / Maybe / Not Available
export const respondAvailability = createAsyncThunk(
  'matches/respond',
  async ({ id, status, playerId }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/matches/${id}/availability`, { status, playerId })
      return { matchId: id, record: data.data }
    } catch (e) {
      return rejectWithValue(err(e, 'Response failed'))
    }
  }
)

// Captain/Admin reminds ONLY pending players. Returns WhatsApp deep links.
export const remindPending = createAsyncThunk(
  'matches/remind',
  async ({ id, final = false }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/matches/${id}/remind`, { final })
      return data
    } catch (e) {
      return rejectWithValue(err(e, 'Reminder failed'))
    }
  }
)

export const selectSquad = createAsyncThunk(
  'matches/selectSquad',
  async ({ id, squad }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/matches/${id}/squad`, squad)
      return data.data
    } catch (e) {
      return rejectWithValue(err(e, 'Squad selection failed'))
    }
  }
)

export const announceSquad = createAsyncThunk(
  'matches/announce',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/matches/${id}/announce`)
      return data
    } catch (e) {
      return rejectWithValue(err(e, 'Announce failed — need exactly 11 + captain + keeper'))
    }
  }
)

export const recordResult = createAsyncThunk(
  'matches/recordResult',
  async ({ id, result }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/matches/${id}/result`, result)
      return { matchId: id, result: data.data }
    } catch (e) {
      return rejectWithValue(err(e, 'Result failed'))
    }
  }
)

export const fetchTeamStats = createAsyncThunk(
  'matches/teamStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/matches/stats/team')
      return data.data
    } catch (e) {
      return rejectWithValue(err(e, 'Stats failed'))
    }
  }
)

export const fetchPlayerStats = createAsyncThunk(
  'matches/playerStats',
  async (playerId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/matches/stats/players/${playerId}`)
      return data.data
    } catch (e) {
      return rejectWithValue(err(e, 'Stats failed'))
    }
  }
)

export const fetchHistory = createAsyncThunk(
  'matches/history',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/matches/history')
      return data
    } catch (e) {
      return rejectWithValue(err(e, 'History failed'))
    }
  }
)

const matchesSlice = createSlice({
  name: 'matches',
  initialState: {
    list: [],
    filter: 'upcoming',
    current: null, // { match, availability }
    lastReminder: null, // { message, data: [{playerId,name,whatsappLink}] }
    teamStats: null,
    myStats: null,
    history: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrent(state) {
      state.current = null
      state.lastReminder = null
    },
    clearMatchesError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(fetchMatches.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload.data })
      .addCase(fetchMatches.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload })
      .addCase(fetchMatchDetail.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(fetchMatchDetail.fulfilled, (s, a) => { s.status = 'succeeded'; s.current = a.payload })
      .addCase(fetchMatchDetail.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload })
      .addCase(createMatch.rejected, (s, a) => { s.error = a.payload })
      .addCase(respondAvailability.fulfilled, (s, a) => {
        // refresh local availability groups optimistically avoided — refetch in UI
        if (s.current) s.current.availability = null
      })
      .addCase(respondAvailability.rejected, (s, a) => { s.error = a.payload })
      .addCase(remindPending.fulfilled, (s, a) => { s.lastReminder = a.payload })
      .addCase(remindPending.rejected, (s, a) => { s.error = a.payload })
      .addCase(selectSquad.fulfilled, (s, a) => {
        if (s.current) s.current.match.squad = a.payload
      })
      .addCase(selectSquad.rejected, (s, a) => { s.error = a.payload })
      .addCase(announceSquad.fulfilled, (s, a) => {
        if (s.current) {
          s.current.match.squad = a.payload.data
          s.current.match.status = 'squad_announced'
        }
      })
      .addCase(announceSquad.rejected, (s, a) => { s.error = a.payload })
      .addCase(recordResult.fulfilled, (s, a) => {
        if (s.current && s.current.match._id === a.payload.matchId) {
          s.current.match.result = a.payload.result
          s.current.match.status = 'completed'
        }
      })
      .addCase(recordResult.rejected, (s, a) => { s.error = a.payload })
      .addCase(fetchTeamStats.fulfilled, (s, a) => { s.teamStats = a.payload })
      .addCase(fetchPlayerStats.fulfilled, (s, a) => { s.myStats = a.payload })
      .addCase(fetchHistory.fulfilled, (s, a) => { s.history = a.payload.data })
      .addCase(cancelMatch.fulfilled, (s, a) => {
        s.list = s.list.filter((m) => m._id !== a.payload._id)
        if (s.current?.match._id === a.payload._id) s.current.match = a.payload
      })
  },
})

export const { clearCurrent, clearMatchesError } = matchesSlice.actions
export default matchesSlice.reducer
