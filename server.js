const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const fs = require('fs');
const FormData = require('form-data')

const app = express();
const PORT = 3000;

// In-memory storage for clip metadata (replace with a database in production)
const clips = [];

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint
app.post('/upload', upload.single('clipFile'), async (req, res) => {
  const { clipName, authorName, clipDescription } = req.body;
  const clipId = uuidv4(); // Generate a unique ID for the clip
  const clipUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const clipPageUrl = `${req.protocol}://${req.get('host')}/clip/${clipId}`;

  // Save clip metadata
  clips.push({
    id: clipId,
    name: clipName,
    author: authorName,
    description: clipDescription,
    filename: req.file.filename,
    url: clipUrl,
  });

  // Send to Discord webhook
  const webhookUrl = 'https://discord.com/api/webhooks/1348816987416952902/-8feTcT_o3fN6ynD7Ux4ZQo5jQhdnaRGSNz3w-FPMfYLHPPB5UuasfGriNg-pNga0A0P';
  const embed = {
    title: clipName,
    description: clipDescription,
    color: 0x7289da,
    fields: [
      { name: 'Author', value: authorName },
      { name: 'Clip Page', value: `[View Clip Page](${clipPageUrl})` },
    ],
  };

  const formData = new FormData();
    formData.append('file', fs.createReadStream(`uploads/${req.file.filename}`));
    formData.append('payload_json', JSON.stringify({
        content: 'New clip uploaded!',
        embeds: [embed],
    }));

    try {
    await axios.post(webhookUrl, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    res.json({ message: 'Clip uploaded and shared on Discord!', clipPageUrl });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to share on Discord' });
    }
});

// Route for individual clip pages
app.get('/clip/:id', (req, res) => {
  const clipId = req.params.id;
  const clip = clips.find((c) => c.id === clipId);

  if (!clip) {
    return res.status(404).send('Clip not found');
  }

  // Render the clip page
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${clip.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #1e1e2f;
          color: white;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        video {
          width: 100%;
          border-radius: 10px;
        }
        h1, h2, p {
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${clip.name}</h1>
        <h2>By ${clip.author}</h2>
        <p>${clip.description}</p>
        <video controls>
          <source src="/uploads/${clip.filename}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <p><a href="/">Upload another clip</a></p>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});