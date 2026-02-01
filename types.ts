export interface ComicPanelData {
  caption: string;
  imageUrl: string | null;
  image_prompt: string;
  dialogue?: {
    left?: string;
    right?: string;
  }
}

export interface ComicStripScript {
  caption: string;
  image_prompt: string;
  dialogue?: {
    left?: string;
    right?: string;
  }
}

export interface Passage {
  id: number;
  title: string;
  text: string;
  selectedOption: string;
}