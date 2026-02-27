# Data Model (MVP)

## TypeScript model

```ts
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
```

## Backend model (Pydantic)

- `ImageMetadataModel`
- `ImageEntryModel`
- `TagStatsModel`
- `PagedImagesResponse`
- `RevisionConflictErrorModel`

## Normalization rules

- Split by comma
- Trim whitespace
- Drop empty tokens
- Preserve first-seen order
- Remove duplicates in same image

