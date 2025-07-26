import { defineStore } from "pinia";
import type { MediaInterface } from "~/models/interface/products/media.interface";

export const useCoreStore = defineStore("core", {
  state: () => ({
    isLoading: false,
    isFirstMount: true,
    playVideoSound: false,
    
    cloudinaryUrls: [] as string[],
    mediaData: <MediaInterface[]>[],
  })
});
