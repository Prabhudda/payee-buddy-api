import express from "express";
import Video from "../models/Video.js";

const router = express.Router();

//Post videos
router.post("/", async (req, res) => {
    try {
      const videos = req.body;
  
      const newVideos = await Promise.all(
        videos.map(async (video) => {
          const existingVideo = await Video.findOne({ videoUrl: video.videoUrl });
          return existingVideo ? null : video;
        })
      );
  
      const filteredVideos = newVideos.filter((video) => video !== null);
  
      if (filteredVideos.length === 0) {
        return res.status(400).json({ message: "All videos already exist" });
      }
  
      const savedVideos = await Video.insertMany(filteredVideos);
  
      res.status(201).json({ message: "Videos added successfully", savedVideos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

//unwatched videos by id
router.get("/unwatched/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const unwatchedVideos = await Video.find({ watchedBy: { $ne: userId } });
    res.status(200).json(unwatchedVideos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//wathced videos by user
router.post("/watched", async (req, res) => {
  try {
    const { userId, videoUrl } = req.body;
    await Video.updateOne({ videoUrl }, { $addToSet: { watchedBy: userId } });
    res.status(200).json({ message: "Video marked as watched" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
