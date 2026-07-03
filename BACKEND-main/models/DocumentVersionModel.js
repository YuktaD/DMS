import mongoose from "mongoose";

const documentVersionSchema = new mongoose.Schema({
  originalDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  pdfUrl: {
    public_id: String,
    url: String,
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: { type: String, default: "unknown" },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DocumentVersionModel = mongoose.models.documentVersion || mongoose.model("DocumentVersion", documentVersionSchema);

export default DocumentVersionModel;