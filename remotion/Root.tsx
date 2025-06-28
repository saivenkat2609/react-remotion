import { Composition, getInputProps } from "remotion";
import { LyricVideo, lyricVideoCompSchema } from "./LyricVideo";
import captions from "../public/captions.json";

export const RemotionRoot: React.FC = () => {
        const inputProps = getInputProps();
        const AudioDurationInSeconds: number = Math.ceil(Number(inputProps.audioDuration)) || 180; // Default to 3 minutes if not provided

  return (
      <Composition
        id="LyricVideo"
        component={LyricVideo}
        durationInFrames={AudioDurationInSeconds * 30} // Assuming 30 fps
        fps={30}
        width={1920}
        height={1080}
        schema={lyricVideoCompSchema}
        defaultProps={{
          audioSrc: "/public/song.mp3",
          bgImage: "/public/background.jpeg",
          captions: captions.map((cap) => ({
            start: parseFloat(cap.start),
            end: parseFloat(cap.start) + parseFloat(cap.dur),
            text: cap.text,
          })),
        }}
      />
  );
};