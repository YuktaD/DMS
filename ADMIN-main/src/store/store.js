import { configureStore } from "@reduxjs/toolkit";
import doctorReducer from "./slices/doctorSlice";
import documentReducer from "./slices/documentSlice";
import documentReducer2 from "./slices/documentSlice2";
import documentVersioningReducer from "./slices/documentVersoningAndReplace";
import forgotPasswordReducer from "./slices/forgotResetPasswordSlice";

export const store = configureStore({
  reducer: {
    doctor: doctorReducer,
    document: documentReducer,
    document2: documentReducer2,
    documentVersioning: documentVersioningReducer,
    forgotPassword: forgotPasswordReducer,
  },
});
