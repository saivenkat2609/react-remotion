// remotion/LyricVideo.tsx
import {Audio, Img, Sequence, AbsoluteFill} from 'remotion';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from "zod";

export const lyricVideoCompSchema = z.object({
  audioSrc: z.string(),
  bgImage: z.string(),
  captions: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      text: z.string(),
    })
  ),
});

export type LyricVideoProps = z.infer<typeof lyricVideoCompSchema>;

export const LyricVideo: React.FC<LyricVideoProps> = ({audioSrc, bgImage, captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill>
      <Img src={bgImage} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <Audio src={audioSrc} />
      {captions.map((cap, i) => {
        const startFrame = Math.floor(cap.start * fps);
        const endFrame = Math.floor(cap.end * fps);
        const visible = frame >= startFrame && frame <= endFrame;
        // Animate opacity and scale for a "pop" effect
        const opacity = interpolate(
          frame,
          [startFrame, startFrame + 10, endFrame - 10, endFrame],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
        );
        const scale = interpolate(
          frame,
          [startFrame, startFrame + 10, endFrame - 10, endFrame],
          [0.8, 1, 1, 0.8],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
        );
        return (
          <Sequence key={i} from={startFrame} durationInFrames={endFrame - startFrame}>
            <AbsoluteFill
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}
            >
              <div
                style={{
                  fontSize: 60,
                  color: 'white',
                  textShadow: '0 4px 20px #000',
                  opacity,
                  transform: `scale(${scale})`,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '0 40px',
                }}
              >
                {cap.text}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};