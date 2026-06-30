import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const documentSlice = createSlice({
  name: "document2",
  initialState: {
    loading: false,
    error: null,
    message: null,
    documents: [],
    currentDocument: null,
    documentVersions: [],
    duplicateDocument: null,
    showDuplicatePrompt: false,
  },
  reducers: {
    // Upload document reducers
    uploadDocumentRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
      state.duplicateDocument = null;
      state.showDuplicatePrompt = false;
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
    documentExistsFound(state, action) {
      state.loading = false;
      state.duplicateDocument = action.payload.existingDocument;
      state.showDuplicatePrompt = true;
      state.error = null;
    },
    clearDuplicatePrompt(state) {
      state.duplicateDocument = null;
      state.showDuplicatePrompt = false;
    },

    // Handle duplicate document actions
    handleDuplicateRequest(state) {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    handleDuplicateSuccess(state, action) {
      state.loading = false;
      state.message = action.payload.message;
      state.documents = state.documents.map(doc => 
        doc._id === action.payload.document._id ? action.payload.document : doc
      );
      state.duplicateDocument = null;
      state.showDuplicatePrompt = false;
    },
    handleDuplicateFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Get all documents reducers
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

    // Delete document reducers
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

    // Create version reducers
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

    // Clear errors and messages
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
      withCredentials: true
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

    return response.data;
  } catch (error) {
    // Check if the error is due to document already existing
    if (error.response?.status === 409 && error.response?.data?.documentExists) {
      dispatch(
        documentSlice.actions.documentExistsFound({
          existingDocument: error.response.data.existingDocument,
        })
      );
      return error.response.data;
    } else {
      dispatch(
        documentSlice.actions.uploadDocumentFailed(
          error.response?.data?.message || "Error uploading document!"
        )
      );
      throw error;
    }
  }
};

// Handle duplicate document action (replace or create version)
export const handleDuplicateDocument = (id, formData, action) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.handleDuplicateRequest());
    
    // Add the action to the formData
    formData.append('action', action); // 'replace' or 'version'
    console.log("Id from Front : ", id);
    
    const config = {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true
    };

    const response = await axios.post(
      `${BASE_URL}/api/admin/handleDuplicateDocument/${id}`,
      formData,
      config
    );

    dispatch(
      documentSlice.actions.handleDuplicateSuccess({
        document: response.data.document,
        message: response.data.message,
      })
    );

    return response.data;
  } catch (error) {
    dispatch(
      documentSlice.actions.handleDuplicateFailed(
        error.response?.data?.message || "Error handling duplicate document!"
      )
    );
    throw error;
  }
};

// Clear duplicate document prompt
export const clearDuplicatePrompt = () => (dispatch) => {
  dispatch(documentSlice.actions.clearDuplicatePrompt());
};

// Get all documents action
export const getAllDocuments = () => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.getAllDocumentsRequest());

    const response = await axios.get(
      `${BASE_URL}/api/admin/getAllDocuments`,
      { withCredentials: true }
    );

    dispatch(
      documentSlice.actions.getAllDocumentsSuccess({
        documents: response.data.documents,
      })
    );

    return response.data;
  } catch (error) {
    dispatch(
      documentSlice.actions.getAllDocumentsFailed(
        error.response?.data?.message || "Error fetching documents!"
      )
    );
    throw error;
  }
};

// Delete document action
export const deleteDocument = (id) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.deleteDocumentRequest());

    const response = await axios.delete(
      `${BASE_URL}/api/admin/deleteDocument/${id}`,
      { withCredentials: true }
    );

    dispatch(
      documentSlice.actions.deleteDocumentSuccess({
        message: response.data.message,
        id: id,
      })
    );

    return response.data;
  } catch (error) {
    dispatch(
      documentSlice.actions.deleteDocumentFailed(
        error.response?.data?.message || "Error deleting document!"
      )
    );
    throw error;
  }
};

// Update document action
export const updateDocument = (id, formData) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.updateDocumentRequest());

    console.log("Updating document:", id);

    const response = await axios.put(
      `${BASE_URL}/api/admin/editDocument/${id}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    dispatch(
      documentSlice.actions.updateDocumentSuccess({
        document: response.data.document,
        message: response.data.message,
      })
    );

    return response.data;
  } catch (error) {
    // Check if error is due to title conflict
    if (error.response?.status === 409) {
      dispatch(
        documentSlice.actions.updateDocumentFailed(
          error.response?.data?.message || "Another document with this title already exists!"
        )
      );
    } else {
      dispatch(
        documentSlice.actions.updateDocumentFailed(
          error.response?.data?.message || "Error updating document!"
        )
      );
    }
    throw error;
  }
};

// Get document versions action
export const getDocumentVersions = (id) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.getDocumentVersionsRequest());

    const response = await axios.get(
      `${BASE_URL}/api/admin/documentVersions/${id}`,
      { withCredentials: true }
    );

    dispatch(
      documentSlice.actions.getDocumentVersionsSuccess({
        versions: response.data.versions,
        currentDocument: response.data.currentDocument,
      })
    );

    return response.data;
  } catch (error) {
    dispatch(
      documentSlice.actions.getDocumentVersionsFailed(
        error.response?.data?.message || "Error fetching document versions!"
      )
    );
    throw error;
  }
};

// Create new version action
export const createNewVersion = (id, formData) => async (dispatch) => {
  try {
    dispatch(documentSlice.actions.createVersionRequest());

    // Ensure createVersion flag is set
    formData.append('createVersion', 'true');

    const config = {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true
    };

    const response = await axios.put(
      `${BASE_URL}/api/admin/editDocument/${id}`,
      formData,
      config
    );

    dispatch(
      documentSlice.actions.createVersionSuccess({
        document: response.data.document,
        versions: response.data.versions,
        message: response.data.message,
      })
    );

    return response.data;
  } catch (error) {
    dispatch(
      documentSlice.actions.createVersionFailed(
        error.response?.data?.message || "Error creating document version!"
      )
    );
    throw error;
  }
};

// Clear all errors
export const clearErrors = () => (dispatch) => {
  dispatch(documentSlice.actions.clearAllErrors());
};

// Clear message
export const clearMessage = () => (dispatch) => {
  dispatch(documentSlice.actions.clearMessage());
};

export default documentSlice.reducer;