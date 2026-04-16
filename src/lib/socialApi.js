const YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export async function fetchYouTubeStats(handle) {
  if (!YT_KEY || !handle) return null;
  const h = handle.replace(/^@/, '');
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(h)}&key=${YT_KEY}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const stats = json.items?.[0]?.statistics;
    if (!stats) return null;
    return {
      subscribers: parseInt(stats.subscriberCount) || 0,
      views:       parseInt(stats.viewCount)        || 0,
      videoCount:  parseInt(stats.videoCount)       || 0,
    };
  } catch {
    return null;
  }
}
