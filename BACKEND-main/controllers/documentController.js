import Document from "../models/documentModel.js";
import UserModel from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import DocumentVersionModel from "../models/DocumentVersionModel.js";

// Get all documents (public)
export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort("-createdAt");
    res.status(200).json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents", error });
  }
};

// Search & Filter documents
export const searchDocuments = async (req, res) => {
  try {
    const { query, category, sortBy } = req.query;
    let filter = {};
    if (query) filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { tags: { $in: [new RegExp(query, "i")] } }
    ];
    if (category && category !== "All") filter.category = category;
    const sortMap = { newest: "-createdAt", oldest: "createdAt", az: "title", za: "-title" };
    const sort = sortMap[sortBy] || "-createdAt";
    const documents = await Document.find(filter).sort(sort);
    res.json({ success: true, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Search failed", error });
  }
};

// Delete document (admin)
export const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ success: false, message: "Document not found!" });
    if (document.pdfUrl?.public_id) {
      await cloudinary.uploader.destroy(document.pdfUrl.public_id, { resource_type: "raw" });
    }
    const versions = await DocumentVersionModel.find({ originalDocument: id });
    for (const v of versions) {
      if (v.pdfUrl?.public_id) await cloudinary.uploader.destroy(v.pdfUrl.public_id, { resource_type: "raw" });
    }
    await DocumentVersionModel.deleteMany({ originalDocument: id });
    await Document.findByIdAndDelete(id);

    // Remove from all user bookmarks
    await UserModel.updateMany({ bookmarks: id }, { $pull: { bookmarks: id } });

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ success: false, message: "Delete failed", error });
  }
};

// Admin stats
export const getDocumentStats = async (req, res) => {
  try {
    const totalDocs = await Document.countDocuments();
    const totalUsers = await UserModel.countDocuments();
    const recentDocs = await Document.find().sort("-createdAt").limit(5);
    const categories = await Document.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    // docs per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const docsPerMonth = await Document.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    res.json({ success: true, stats: { totalDocs, totalUsers, recentDocs, categories, docsPerMonth } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching stats", error });
  }
};
