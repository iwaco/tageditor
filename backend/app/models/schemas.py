from __future__ import annotations

from pydantic import BaseModel, Field


class ImageMetadataModel(BaseModel):
    width: int
    height: int
    fileSize: int
    mtime: float


class ImageEntryModel(BaseModel):
    id: str
    baseName: str
    category: str
    imagePath: str
    imageUrl: str
    tagFilePath: str
    tags: list[str]
    thumbnailUrl: str
    metadata: ImageMetadataModel
    revision: int = 0


class TagStatsModel(BaseModel):
    tag: str
    count: int
    categories: list[str] = Field(default_factory=list)


class OpenDatasetRequest(BaseModel):
    rootPath: str


class OpenDatasetResponse(BaseModel):
    rootPath: str
    categories: list[str]
    images: list[ImageEntryModel]
    total: int
    tagStats: list[TagStatsModel]


class PagedImagesResponse(BaseModel):
    items: list[ImageEntryModel]
    total: int
    page: int
    pageSize: int


class ImageDetailResponse(BaseModel):
    item: ImageEntryModel
    prevId: str | None = None
    nextId: str | None = None


class UpdateTagsRequest(BaseModel):
    tags: list[str]
    revision: int


class UpdateTagsResponse(BaseModel):
    item: ImageEntryModel


class BatchTagsRequest(BaseModel):
    imageIds: list[str]
    tags: list[str]


class BatchTagsResponse(BaseModel):
    updated: int


class TagStatsResponse(BaseModel):
    items: list[TagStatsModel]
