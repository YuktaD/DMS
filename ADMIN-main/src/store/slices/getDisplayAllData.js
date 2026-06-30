import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const getAllDataSlice = createSlice({
  name: "getAllData",
  initialState: {
    loading: false,
    error: null,
    grampanchayats: [],
    totalCount: 0,
    message: null,
  },
  reducers: {
    fetchGrampanchayatsRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    fetchGrampanchayatsSuccess(state, action) {
      state.loading = false;
      state.error = null;
      state.grampanchayats = action.payload.data;
      state.totalCount = action.payload.total;
      state.message = action.payload.message;
    },
    fetchGrampanchayatsFailed(state, action) {
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

const BASE_URL = import.meta.env.VITE_API_KEY;

// Fetch all grampanchayats action
export const fetchAllGrampanchayats = () => async (dispatch) => {
  try {
    dispatch(getAllDataSlice.actions.fetchGrampanchayatsRequest());
    
    const response = await axios.get(
      `${BASE_URL}/api/admin/allGrampanchayats`,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" }
      }
    );

    dispatch(
      getAllDataSlice.actions.fetchGrampanchayatsSuccess({
        data: response.data.data,
        total: response.data.total,
        message: response.data.message
      })
    );
  } catch (error) {
    dispatch(
      getAllDataSlice.actions.fetchGrampanchayatsFailed(
        error.response?.data?.message || "Error fetching grampanchayats!"
      )
    );
  }
};

// Clear all errors
export const clearAllGrampanchayatErrors = () => (dispatch) => {
  dispatch(getAllDataSlice.actions.clearAllErrors());
};

// Clear all messages
export const clearAllGrampanchayatMessages = () => (dispatch) => {
  dispatch(getAllDataSlice.actions.clearMessages());
};

export default getAllDataSlice.reducer;