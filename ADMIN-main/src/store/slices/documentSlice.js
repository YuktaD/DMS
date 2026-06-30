import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const documentSlice = createSlice({
  name: "document",
  initialState: {
    loading: false,
    error: null,
    message: null,
    documents: [],
    currentDocument: null,
  },
  reducers: {
    uploadDocumentRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    uploadDocumentSuccess(state, action) {
      state.loading = false;
      state.error = null;
      state.message = action.payload.message;
      state.documents.unshift(action.payload.document);
    },
    uploadDocumentFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },
    getAllDocumentsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    getAllDocumentsSuccess(state, action) {
      state.loading = false;
      state.documents = action.payload.documents;
      state.error = null;
    },
    getAllDocumentsFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    deleteDocumentRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    deleteDocumentSuccess(state, action) {
      state.loading = false;
      state.error = null;
      state.message = action.payload.message;
      state.documents = state.documents.filter(
        doc => doc._id !== action.payload.id
      );
    },
    deleteDocumentFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },


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



    clearAllErrors(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = null;
    },
  },
});

const BASE_URL = import.meta.env.VITE_API_KEY;

// Upload document action
export const uploadDocument = (formData) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.uploadDocumentRequest());
    
    const config = {
      headers: { "Content-Type": "multipart/form-data" },
    };

    const response = await axios.post(
      `${BASE_URL}/api/admin/uploadDocuments`,
      formData,
      config
    );

    dispatch(
      documentSlice.actions.uploadDocumentSuccess({
        document: response.data.document,
        message: response.data.message,
      })
    );
  } catch (error) {
    dispatch(
      documentSlice.actions.uploadDocumentFailed(
        error.response?.data?.message || "Error uploading document!"
      )
    );
  }
};

// Get all documents action
export const getAllDocuments = () => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.getAllDocumentsRequest());

    const response = await axios.get(`${BASE_URL}/api/admin/getAllDocuments`);

    dispatch(
      documentSlice.actions.getAllDocumentsSuccess({
        documents: response.data.documents,
      })
    );
  } catch (error) {
    dispatch(
      documentSlice.actions.getAllDocumentsFailed(
        error.response?.data?.message || "Error fetching documents!"
      )
    );
  }
};

// Delete document action
export const deleteDocument = (id) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.deleteDocumentRequest());

    const response = await axios.delete(`${BASE_URL}/api/documents/${id}`);

    dispatch(
      documentSlice.actions.deleteDocumentSuccess({
        message: response.data.message,
        id: id,
      })
    );
  } catch (error) {
    dispatch(
      documentSlice.actions.deleteDocumentFailed(
        error.response?.data?.message || "Error deleting document!"
      )
    );
  }
};


export const updateDocument = (id, updateData) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.updateDocumentRequest());

    const response = await axios.put(
      `${BASE_URL}/api/admin/editDocument/${id}`,
      updateData
    );

    dispatch(
      documentSlice.actions.updateDocumentSuccess({
        document: response.data.document,
        message: response.data.message,
      })
    );
  } catch (error) {
    dispatch(
      documentSlice.actions.updateDocumentFailed(
        error.response?.data?.message || "Error updating document!"
      )
    );
  }
};

// Clear all errors
export const clearAllDocumentErrors = () => (dispatch) => {
  dispatch(documentSlice.actions.clearAllErrors());
};

// Clear message
export const clearDocumentMessage = () => (dispatch) => {
  dispatch(documentSlice.actions.clearMessage());
};

export default documentSlice.reducer;