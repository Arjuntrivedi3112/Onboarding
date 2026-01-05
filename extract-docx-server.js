import express from "express";
import fileUpload from "express-fileupload";
import mammoth from "mammoth";
import cors from "cors";

const app = express();
app.use(cors());
app.use(fileUpload());

app.post('/extract-docx', async (req, res) => {
  console.log("/extract-docx endpoint hit");
  console.log("Request method:", req.method);
  console.log("Request headers:", req.headers);
  if (!req.files || !req.files.file) {
    console.error("No file uploaded", req.files);
    return res.status(400).json({ error: "No file uploaded" });
  }
  const file = req.files.file;
  console.log("Received file:", file.name, file.mimetype, file.size, "bytes");
  try {
    const { value } = await mammoth.extractRawText({ buffer: file.data });
    console.log("Extracted text length:", value.length);
    res.json({ text: value });
  } catch (err) {
    console.error("Mammoth extraction error:", err);
    res.status(500).json({ error: "Failed to extract text from DOCX", details: err && err.message ? err.message : err });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`DOCX extraction server running on port ${PORT}`);
});
