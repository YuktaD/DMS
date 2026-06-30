// staffSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  loading: false,
  error: null,
  staff: [],
  totalCount: 0,
  message: null,
};

const staffSlice = createSlice({
  name: "staff", // Changed from "getStaff" to match the state selector
  initialState,
  reducers: {
    fetchStaffRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchStaffSuccess(state, action) {
      state.loading = false;
      state.error = null;
      state.staff = action.payload.data;
      state.totalCount = action.payload.total;
      state.message = action.payload.message;
    },
    fetchStaffFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    clearAllErrors(state) {
      state.error = null;
    },
    clearMessages(state) {
      state.message = null;
    }
  },
});

export const {
  fetchStaffRequest,
  fetchStaffSuccess,
  fetchStaffFailed,
  clearAllErrors,
  clearMessages
} = staffSlice.actions;

const BASE_URL = import.meta.env.VITE_API_KEY;

export const fetchAllStaff = () => async (dispatch) => {
  try {
    dispatch(fetchStaffRequest());
    
    const response = await axios.get(
      `${BASE_URL}/api/admin/getAllStaff`,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" }
      }
    );

    dispatch(
      fetchStaffSuccess({
        data: response.data.data,
        total: response.data.total,
        message: response.data.message
      })
    );
  } catch (error) {
    dispatch(
      fetchStaffFailed(
        error.response?.data?.message || "Error fetching staff!"
      )
    );
  }
};

export const clearAllStaffErrors = () => (dispatch) => {
  dispatch(clearAllErrors());
};

export const clearAllStaffMessages = () => (dispatch) => {
  dispatch(clearMessages());
};

export default staffSlice.reducer;