export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  mtime: number;
}

export interface ImageEntry {
  id: string;
  baseName: string;
  category: string;
  imagePath: string;
  imageUrl: string;
  tagFilePath: string;
  tags: string[];
  thumbnailUrl: string;
  metadata: ImageMetadata;
  revision: number;
}

export interface TagStats {
  tag: string;
  count: number;
  categories: string[];
}

export interface EditAction {
  type: "set_tags";
  imageId: string;
  beforeTags: string[];
  afterTags: string[];
  timestamp: number;
}

export interface OpenDatasetResponse {
  rootPath: string;
  categories: string[];
  images: ImageEntry[];
  total: number;
  tagStats: TagStats[];
}
