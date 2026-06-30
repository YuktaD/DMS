import express from "express";
import { getAllDocuments, deleteDocument, getDocumentStats, searchDocuments } from "../controllers/documentController.js";
import { adminIdentifier } from "../middleware/adminIdentification.js";

const router = express.Router();

router.get("/getAll", getAllDocuments);
router.get("/search", searchDocuments);
router.get("/stats", adminIdentifier, getDocumentStats);
router.delete("/delete/:id", adminIdentifier, deleteDocument);

export default router;
