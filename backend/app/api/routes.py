from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    BatchTagsRequest,
    BatchTagsResponse,
    ImageDetailResponse,
    OpenDatasetRequest,
    OpenDatasetResponse,
    PagedImagesResponse,
    TagStatsResponse,
    UpdateTagsRequest,
    UpdateTagsResponse,
)
from app.services.repository import (
    DatasetNotOpenedError,
    DatasetRepository,
    RepositoryError,
    RevisionConflictError,
)
from app.services.thumbnails import ensure_thumbnail, thumbnail_response
from fastapi.responses import FileResponse

router = APIRouter()
repo = DatasetRepository()


@router.post("/dataset/open", response_model=OpenDatasetResponse)
def open_dataset(req: OpenDatasetRequest) -> OpenDatasetResponse:
    try:
        categories, images, stats = repo.open_dataset(req.rootPath)
    except RepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return OpenDatasetResponse(
        rootPath=req.rootPath,
        categories=categories,
        images=images,
        total=len(images),
        tagStats=stats,
    )


@router.get("/images", response_model=PagedImagesResponse)
def list_images(
    category: str | None = None,
    hasTag: list[str] = Query(default=[]),
    notTag: list[str] = Query(default=[]),
    page: int = 1,
    pageSize: int = 200,
) -> PagedImagesResponse:
    try:
        items, total = repo.list_images(category, hasTag, notTag, page, pageSize)
    except DatasetNotOpenedError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return PagedImagesResponse(items=items, total=total, page=page, pageSize=pageSize)


@router.get("/images/{image_id:path}", response_model=ImageDetailResponse)
def get_image_detail(image_id: str) -> ImageDetailResponse:
    try:
        item, prev_id, next_id = repo.get_image(image_id)
    except RepositoryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ImageDetailResponse(item=item, prevId=prev_id, nextId=next_id)


@router.post("/images/{image_id:path}/tags", response_model=UpdateTagsResponse)
def update_image_tags(image_id: str, req: UpdateTagsRequest) -> UpdateTagsResponse:
    try:
        item = repo.update_tags(image_id, req.tags, req.revision)
        return UpdateTagsResponse(item=item)
    except RevisionConflictError as exc:
        raise HTTPException(
            status_code=409,
            detail={
                "message": str(exc),
                "imageId": exc.image_id,
                "currentRevision": exc.revision,
            },
        ) from exc
    except RepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/images/batch/tags:add", response_model=BatchTagsResponse)
def batch_add_tags(req: BatchTagsRequest) -> BatchTagsResponse:
    try:
        updated = repo.batch_add_tags(req.imageIds, req.tags)
    except RepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return BatchTagsResponse(updated=updated)


@router.post("/images/batch/tags:remove", response_model=BatchTagsResponse)
def batch_remove_tags(req: BatchTagsRequest) -> BatchTagsResponse:
    try:
        updated = repo.batch_remove_tags(req.imageIds, req.tags)
    except RepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return BatchTagsResponse(updated=updated)


@router.get("/tags/stats", response_model=TagStatsResponse)
def get_tag_stats() -> TagStatsResponse:
    try:
        items = repo.get_tag_stats()
    except RepositoryError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return TagStatsResponse(items=items)


@router.get("/assets/thumbnail/{encoded_id}")
def get_thumbnail(encoded_id: str):
    try:
        image_id = repo.decode_id(encoded_id)
        item, _, _ = repo.get_image(image_id)
        root = repo.get_root_path()
    except RepositoryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    source_file = root / item.imagePath
    cache_dir = root / ".tageditor" / "thumbnails"
    try:
        thumb = ensure_thumbnail(cache_dir, source_file, encoded_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return thumbnail_response(thumb)


@router.get("/assets/image/{encoded_id}")
def get_full_image(encoded_id: str):
    try:
        image_id = repo.decode_id(encoded_id)
        item, _, _ = repo.get_image(image_id)
        root = repo.get_root_path()
    except RepositoryError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(root / item.imagePath)
