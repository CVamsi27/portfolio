/** Curated discovery links: these do not claim a verified episode or playback. */
export const STUDY_PODCASTS = [
  { title: "Syntax", topic: "Web development and full-stack engineering" },
  {
    title: "Software Engineering Daily",
    topic: "Systems, databases, and architecture",
  },
  { title: "The Changelog", topic: "Developer tools and open source" },
].map((podcast) => {
  const url = new URL("https://music.youtube.com/search");
  url.searchParams.set("q", `${podcast.title} podcast`);
  return { ...podcast, url: url.toString() };
});

export function podcastsForTopic(topic:string){
 const normalized=topic.toLowerCase();
 const preferred=/react|frontend|javascript|typescript|nextjs|css|web/.test(normalized)?"Syntax":/database|system|architecture|backend|distributed|security/.test(normalized)?"Software Engineering Daily":"The Changelog";
 return [...STUDY_PODCASTS].sort((a,b)=>Number(b.title===preferred)-Number(a.title===preferred));
}
