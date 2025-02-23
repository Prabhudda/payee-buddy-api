import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true, unique: true },
  thumbnail: { type: String, required: true },
  watchedBy: { type: [String], default: [] }, 
});

const Video = mongoose.model("Video", videoSchema);

export default Video;