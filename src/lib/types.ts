export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  durationSeconds?: number;
  publishedAt?: string;
};

export type YouTubePlaylist = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
};

export type LearningItem = {
  videoId: string;
  title: string;
  url: string;
  durationMinutes?: number;
};

export type LearningModule = {
  title: string;
  estimatedTimeMinutes?: number;
  items: LearningItem[];
};

export type LearningTips = {
  milestones: string[];
  exercises?: string[];
  cheatSheet?: string;
};

export type LearningPlan = {
  topic: string;
  mode: "playlist" | "curated";
  playlistId?: string;
  playlistTitle?: string;
  playlistChannelTitle?: string;
  modules?: LearningModule[];
  totalEstimatedTimeMinutes?: number;
  tips?: LearningTips;
};



