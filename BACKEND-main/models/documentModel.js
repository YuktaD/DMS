import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Document title is required'], trim: true },
  description: { type: String, required: [true, 'Document description is required'], trim: true },
  pdfUrl: {
    public_id: { type: String, required: true },
    url: { type: String, required: true }
  },
  fileName: { type: String, required: true },
  category: { type: String, default: "General", trim: true },
  tags: [{ type: String, trim: true }],
  currentVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const DocumentModel = mongoose.models.document || mongoose.model("Document", documentSchema);
export default DocumentModel;
