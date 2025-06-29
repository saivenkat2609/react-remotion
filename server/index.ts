import express from "express";
import { makeRenderQueue } from "./render-queue";
import { bundle } from "@remotion/bundler";
import path from "node:path";
import { ensureBrowser } from "@remotion/renderer";
import fs from "fs";
import captions from "../public/captions.json";

const { PORT = 3001, REMOTION_SERVE_URL } = process.env;

function setupApp({ remotionBundleUrl }: { remotionBundleUrl: string }) {
  const app = express();

  const rendersDir =process.env.STATIC_DIR;
  console.log(rendersDir);
  
  const queue = makeRenderQueue({
    port: Number(PORT),
    serveUrl: remotionBundleUrl,
    rendersDir,
  });

  // Host renders on /renders
  app.use("/renders", express.static(rendersDir));
  app.use(express.json());

  // Endpoint to create a new job
  app.post("/renders", async (req, res) => {
    const staticDir = path.resolve(process.env.STATIC_DIR||"public");
    const audioPath = path.join(staticDir, "song.mp3");
    const backgroundImagePath = path.join(staticDir, "background.jpeg");
    const srtPath = path.join(staticDir, "captions.json");
    console.log(staticDir, audioPath, backgroundImagePath, srtPath);

    console.log(!fs.existsSync(audioPath) ||
      !fs.existsSync(backgroundImagePath) ||
      !fs.existsSync(srtPath));
    // Check files exist
    if (
      !fs.existsSync(audioPath) ||
      !fs.existsSync(backgroundImagePath) ||
      !fs.existsSync(srtPath)
    ) {
      return res.status(500).json({ message: "Missing required static files" });
    }

    // const subtitleText = fs.readFileSync(srtPath, "utf-8");
    const subtitleData =  captions.map((cap) => ({
            start: parseFloat(cap.start),
            end: parseFloat(cap.start) + parseFloat(cap.dur),
            text: cap.text,
          }))

    const jobId = queue.createJob({
      audioPath,
      backgroundImagePath,
      subtitleData,
    });
    res.json({ jobId });
  });

  // Endpoint to get a job status
  app.get("/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const job = queue.jobs.get(jobId);

    res.json(job);
  });

  // Endpoint to cancel a job
  app.delete("/renders/:jobId", (req, res) => {
    const jobId = req.params.jobId;

    const job = queue.jobs.get(jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    if (job.status !== "queued" && job.status !== "in-progress") {
      res.status(400).json({ message: "Job is not cancellable" });
      return;
    }

    job.cancel();

    res.json({ message: "Job cancelled" });
  });

  return app;
}

async function main() {
  await ensureBrowser();

  const remotionBundleUrl = REMOTION_SERVE_URL
    ? REMOTION_SERVE_URL
    : await bundle({
        entryPoint: path.resolve("remotion/index.ts"),
        onProgress(progress) {
          console.info(`Bundling Remotion project: ${progress}%`);
        },
      });

  const app = setupApp({ remotionBundleUrl });

  app.listen(PORT,'0.0.0.0', () => {
    console.info(`Server is running on port ${PORT}`);
  });
}

main();
