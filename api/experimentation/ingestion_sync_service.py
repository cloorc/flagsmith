from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from django.conf import settings
from redis.cluster import RedisCluster

if TYPE_CHECKING:
    from datetime import datetime

INGESTION_ENVIRONMENT_KEY_PREFIX = "experimentation:environment_keys:"


SOCKET_TIMEOUT = 1


@lru_cache(maxsize=1)
def _get_client() -> RedisCluster:
    return RedisCluster.from_url(  # type: ignore[no-untyped-call,no-any-return]
        settings.INGESTION_REDIS_URL,
        socket_timeout=SOCKET_TIMEOUT,
        socket_keepalive=True,
    )


def set_ingestion_key(
    key: str,
    *,
    environment_key: str,
    expires_at: datetime | None = None,
) -> None:
    """Whitelist ``key`` for warehouse ingestion, mapping it to the canonical
    ``environment_key`` (the environment's client API key) the pipeline stores
    events under. ``expires_at`` sets a matching Redis TTL so a time-limited
    server-side key falls out of the whitelist automatically."""
    redis_key = f"{INGESTION_ENVIRONMENT_KEY_PREFIX}{key}"
    _get_client().set(
        redis_key,
        environment_key,
        exat=int(expires_at.timestamp()) if expires_at is not None else None,
    )


def delete_ingestion_key(key: str) -> None:
    redis_key = f"{INGESTION_ENVIRONMENT_KEY_PREFIX}{key}"
    _get_client().delete(redis_key)
