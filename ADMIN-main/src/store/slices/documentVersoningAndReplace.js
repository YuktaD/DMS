import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const documentSlice = createSlice({
  name: "documentVersioning",
  initialState: {
    loading: false,
    error: null,
    message: null,
    documents: [],
    currentDocument: null,
    documentVersions: [],
  },
  reducers: {
    // Document update reducers
    updateDocumentRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    updateDocumentSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
      state.documents = state.documents.map(doc => 
        doc._id === action.payload.document._id ? action.payload.document : doc
      );
    },
    updateDocumentFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Document version reducers
    getDocumentVersionsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    getDocumentVersionsSuccess(state, action) {
      state.loading = false;
      state.documentVersions = action.payload.versions;
      state.currentDocument = action.payload.currentDocument;
    },
    getDocumentVersionsFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    createVersionRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    createVersionSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
      state.documents = state.documents.map(doc =>
        doc._id === action.payload.document._id ? action.payload.document : doc
      );
      // Optionally update documentVersions if returned in the response
      if (action.payload.versions) {
        state.documentVersions = action.payload.versions;
      }
    },
    createVersionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    clearAllErrors(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = null;
    },
  },
});

const BASE_URL=import.meta.env.VITE_API_KEY;

export const getDocumentVersions = (id) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.getDocumentVersionsRequest());

    const response = await axios.get(
      `${BASE_URL}/api/admin/documentVersions/${id}`,
      { withCredentials: true }
    );

    dispatch(documentSlice.actions.getDocumentVersionsSuccess({
      versions: response.data.versions,
      currentDocument: response.data.currentDocument
    }));
  } catch (error) {
    dispatch(documentSlice.actions.getDocumentVersionsFailed(
      error.response?.data?.message || "Error fetching document versions!"
    ));
  }
};
// In your Redux slice, update the createNewVersion action creator:
export const createNewVersion = (id, formData) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.createVersionRequest());

    const config = {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true
    };

    // Send formData directly without modification
    const response = await axios.put(
      `${BASE_URL}/api/admin/createDocumentVersion/${id}`,
      formData,
      config
    );

    dispatch(documentSlice.actions.createVersionSuccess({
      document: response.data.document,
      versions: response.data.versions,
      message: response.data.message
    }));

    return response.data;
  } catch (error) {
    dispatch(documentSlice.actions.createVersionFailed(
      error.response?.data?.message || "Error creating document version!"
    ));
    throw error;
  }
};

// Similarly, update the updateDocument action creator:
export const updateDocument = (id, formData) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.updateDocumentRequest());

  console.log("this is from update document",id ,"formadata bhushan",formData.get("title"))

    const response = await axios.put(
      `${BASE_URL}/api/admin/editDocument/${id}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    dispatch(documentSlice.actions.updateDocumentSuccess({
      document: response.data.document,
      message: response.data.message
    }));

    return response.data;
  } catch (error) {
    dispatch(documentSlice.actions.updateDocumentFailed(
      error.response?.data?.message || "Error updating document!"
    ));
    throw error;
  }
};
export const clearErrors = () => (dispatch) => {
  dispatch(documentSlice.actions.clearAllErrors());
};

export const clearMessage = () => (dispatch) => {
  dispatch(documentSlice.actions.clearMessage());
};

export default documentSlice.reducer;