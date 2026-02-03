import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import cors from "cors";

const app = express();
const upload = multer({ dest: "uploads/" });

// Allow frontend JS from any origin (optional)
app.use(cors());

// Serve frontend
app.use(express.static(path.join(path.resolve(), "public")));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(path.resolve(), "public", "index.html"));
});

// Remove background endpoint
app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No image uploaded");

    const type = req.query.type === "webp" ? "webp" : "png";

    const form = new FormData();
    form.append("image_file", fs.createReadStream(req.file.path));
    form.append("size", "preview"); // keeps original dimensions
    form.append("format", type);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", `image/${type}`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=result.${type}`
    );
    res.send(buffer);

    fs.unlinkSync(req.file.path); // cleanup
  } catch (err) {
    console.error(err);
    res.status(500).send("Background removal failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
