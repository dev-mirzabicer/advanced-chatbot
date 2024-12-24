// src/pages/api/parse-pdf.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable Error:", err);
      return res.status(500).json({ error: "Error parsing the file" });
    }

    const file = files.file ? files.file[0] : undefined;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const dataBuffer = fs.readFileSync(file.filepath);
      const data = await pdfParse(dataBuffer);
      res.status(200).json({ text: data.text });
    } catch (error) {
      console.error("PDF Parsing Error:", error);
      res.status(500).json({ error: "Error parsing PDF" });
    }
  });
}
