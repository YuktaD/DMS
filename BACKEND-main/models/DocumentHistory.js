import mongoose from 'mongoose';

const documentHistorySchema = new mongoose.Schema({
  originalDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  action: { type: String, required: true }, // e.g., upload, update, rename, version, delete, replace
  performedBy: { type: String }, // admin id or email (string to avoid joins)
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const DocumentHistory = mongoose.models.documentHistory || mongoose.model('DocumentHistory', documentHistorySchema);
export default DocumentHistory;
