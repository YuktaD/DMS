import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_KEY;

const forgotResetPassSlice = createSlice({
  name: "forgotPassword",
  initialState: {
    loading: false,
    error: null,
    message: null,
    codeSent: false,
    codeVerified: false,
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
    setCodeSent(state) {
      state.codeSent = true;
    },
    setCodeVerified(state) {
      state.codeVerified = true;
    },
    clearAll(state) {
      state.error = null;
      state.message = null;
      state.codeSent = false;
      state.codeVerified = false;
      state.loading = false;
    },
  },
});

const { requestStart, requestSuccess, requestFail, setCodeSent, setCodeVerified } = forgotResetPassSlice.actions;

// Step 1 — Send OTP to admin email
export const sendForgotPasswordOTP = (adminEmailId) => async (dispatch) => {
  try {
    dispatch(requestStart());
    const { data } = await axios.patch(
      `${BASE_URL}/api/admin/send-forgot-password-code`,
      { adminEmailId },
      { withCredentials: true }
    );
    if (data.success) {
      dispatch(requestSuccess(data.message || "OTP sent to your email!"));
      dispatch(setCodeSent());
    } else {
      dispatch(requestFail(data.message || "Failed to send OTP"));
    }
  } catch (err) {
    dispatch(requestFail(err.response?.data?.message || "Failed to send OTP. Check your email."));
  }
};

// Step 2 — Verify OTP & reset password
export const verifyOTPAndResetPassword =
  (adminEmailId, providedCode, newPassword) => async (dispatch) => {
    try {
      dispatch(requestStart());
      const { data } = await axios.patch(
        `${BASE_URL}/api/admin/verify-forgot-password-code`,
        { adminEmailId, providedCode, newPassword },
        { withCredentials: true }
      );
      if (data.success) {
        dispatch(requestSuccess(data.message || "Password reset successfully!"));
        dispatch(setCodeVerified());
      } else {
        dispatch(requestFail(data.message || "Invalid OTP"));
      }
    } catch (err) {
      dispatch(requestFail(err.response?.data?.message || "Invalid OTP or expired. Try again."));
    }
  };

export const clearAllForgotResetPassErrors = () => (dispatch) =>
  dispatch(forgotResetPassSlice.actions.clearAll());

export default forgotResetPassSlice.reducer;
