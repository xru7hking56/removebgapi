import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    const image = fs.readFileSync(req.file.path);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_KEY,
      },
      body: (() => {
        const form = new FormData();
        form.append("image_file", image, req.file.originalname);
        form.append("size", "auto");
        return form;
      })(),
    });

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(buffer));

    fs.unlinkSync(req.file.path);
  } catch (err) {
    res.status(500).json({ error: "Background removal failed" });
  }
});

app.listen(3000, () => console.log("Server running"));
