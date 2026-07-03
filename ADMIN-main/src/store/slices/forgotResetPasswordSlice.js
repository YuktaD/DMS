import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_KEY;

const forgotResetPassSlice = createSlice({
  name: "forgotPassword",
  initialState: {
    loading: false,
    error: null,
    message: null,
    questionFetched: false,
    securityQuestion: null,
    passwordResetDone: false,
  },
  reducers: {
    requestStart(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    requestSuccess(state, action) {
      state.loading = false;
      state.message = action.payload;
    },
    requestFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setQuestionFetched(state, action) {
      state.questionFetched = true;
      state.securityQuestion = action.payload || null;
    },
    setPasswordResetDone(state) {
      state.passwordResetDone = true;
    },
    clearAll(state) {
      state.error = null;
      state.message = null;
      state.questionFetched = false;
      state.securityQuestion = null;
      state.passwordResetDone = false;
      state.loading = false;
    },
  },
});

const { requestStart, requestSuccess, requestFail, setQuestionFetched, setPasswordResetDone } = forgotResetPassSlice.actions;

export const fetchForgotPasswordQuestion = (adminEmailId) => async (dispatch) => {
  try {
    dispatch(requestStart());
    const { data } = await axios.patch(
      `${BASE_URL}/api/admin/forgot-password`,
      { adminEmailId },
      { withCredentials: true }
    );
    if (data.success) {
      dispatch(requestSuccess(data.message || "Security question loaded."));
      dispatch(setQuestionFetched(data.securityQuestion));
    } else {
      dispatch(requestFail(data.message || "Failed to fetch security question"));
    }
  } catch (err) {
    dispatch(requestFail(err.response?.data?.message || "Failed to fetch security question."));
  }
};

export const resetPasswordWithSecurityAnswer =
  (adminEmailId, securityAnswer, newPassword) => async (dispatch) => {
    try {
      dispatch(requestStart());
      const { data } = await axios.patch(
        `${BASE_URL}/api/admin/reset-password`,
        { adminEmailId, securityAnswer, newPassword },
        { withCredentials: true }
      );
      if (data.success) {
        dispatch(requestSuccess(data.message || "Password reset successfully!"));
        dispatch(setPasswordResetDone());
      } else {
        dispatch(requestFail(data.message || "Invalid answer or password."));
      }
    } catch (err) {
      dispatch(requestFail(err.response?.data?.message || "Invalid security answer. Try again."));
    }
  };

export const clearAllForgotResetPassErrors = () => (dispatch) =>
  dispatch(forgotResetPassSlice.actions.clearAll());

export default forgotResetPassSlice.reducer;
