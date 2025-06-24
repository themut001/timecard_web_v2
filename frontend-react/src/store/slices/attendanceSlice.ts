import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { attendanceAPI, handleApiError } from '@/services/api'

interface TimeRecord {
  id: number
  date: string
  clockIn?: string
  clockOut?: string
  breakTime: number
  totalHours: number
  status: 'working' | 'break' | 'off'
}

interface AttendanceState {
  currentStatus: 'off' | 'working' | 'break'
  todayRecord: TimeRecord | null
  recentRecords: TimeRecord[]
  monthlyRecords: TimeRecord[]
  loading: boolean
  error: string | null
}

const initialState: AttendanceState = {
  currentStatus: 'off',
  todayRecord: null,
  recentRecords: [],
  monthlyRecords: [],
  loading: false,
  error: null,
}

// Async thunks
export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async ({ photo }: { photo?: string }, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.clockIn(photo)
      return response
    } catch (error) {
      return rejectWithValue(handleApiError(error))
    }
  }
)

export const clockOut = createAsyncThunk(
  'attendance/clockOut',
  async ({ photo }: { photo?: string }, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.clockOut(photo)
      return response
    } catch (error) {
      return rejectWithValue(handleApiError(error))
    }
  }
)

export const startBreak = createAsyncThunk('attendance/startBreak', async (_, { rejectWithValue }) => {
  try {
    const response = await attendanceAPI.startBreak()
    return response
  } catch (error) {
    return rejectWithValue(handleApiError(error))
  }
})

export const endBreak = createAsyncThunk('attendance/endBreak', async (_, { rejectWithValue }) => {
  try {
    const response = await attendanceAPI.endBreak()
    return response
  } catch (error) {
    return rejectWithValue(handleApiError(error))
  }
})

export const getTodayRecord = createAsyncThunk('attendance/getTodayRecord', async (_, { rejectWithValue }) => {
  try {
    const response = await attendanceAPI.getTodayRecord()
    return response
  } catch (error) {
    return rejectWithValue(handleApiError(error))
  }
})

export const getRecentRecords = createAsyncThunk('attendance/getRecentRecords', async (limit: number = 10, { rejectWithValue }) => {
  try {
    const response = await attendanceAPI.getRecentRecords(limit)
    return response
  } catch (error) {
    return rejectWithValue(handleApiError(error))
  }
})

export const getMonthlyRecords = createAsyncThunk(
  'attendance/getMonthlyRecords',
  async (month: string, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.getMonthlyRecords(month)
      return response
    } catch (error) {
      return rejectWithValue(handleApiError(error))
    }
  }
)

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Clock In
      .addCase(clockIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clockIn.fulfilled, (state, action) => {
        state.loading = false
        state.currentStatus = 'working'
        state.todayRecord = action.payload.record
      })
      .addCase(clockIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || '出勤打刻に失敗しました'
      })
      // Clock Out
      .addCase(clockOut.fulfilled, (state, action) => {
        state.currentStatus = 'off'
        state.todayRecord = action.payload.record
      })
      // Break Start/End
      .addCase(startBreak.fulfilled, (state, action) => {
        state.currentStatus = 'break'
        state.todayRecord = action.payload.record
      })
      .addCase(endBreak.fulfilled, (state, action) => {
        state.currentStatus = 'working'
        state.todayRecord = action.payload.record
      })
      // Get Today Record
      .addCase(getTodayRecord.fulfilled, (state, action) => {
        state.todayRecord = action.payload.record
        state.currentStatus = action.payload.status
      })
      // Get Recent Records
      .addCase(getRecentRecords.fulfilled, (state, action) => {
        state.recentRecords = action.payload.records
      })
      // Get Monthly Records
      .addCase(getMonthlyRecords.fulfilled, (state, action) => {
        state.monthlyRecords = action.payload.records
      })
  },
})

export const { clearError } = attendanceSlice.actions
export default attendanceSlice.reducer