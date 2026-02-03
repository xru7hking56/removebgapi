import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const app = express();
const upload = multer({ dest: "uploads/" });

// serve frontend
app.use(express.static(path.join(path.resolve(), "public")));

// homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(path.resolve(), "public", "index.html"));
});

// remove background endpoint
app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    const form = new FormData();
    form.append("image_file", fs.createReadStream(req.file.path));
    form.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_KEY,
      },
      body: form,
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).send(err);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "inline; filename=result.png");
    res.send(buffer);

    fs.unlinkSync(req.file.path); // cleanup
  } catch (err) {
    console.error(err);
    res.status(500).send("Background removal failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
