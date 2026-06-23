from typing import Any

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from environments.models import EnvironmentAPIKey
from experimentation.models import WarehouseConnection
from experimentation.tasks import (
    reconcile_server_side_key_ingestion,
    remove_server_side_key_from_ingestion,
)


def _environment_has_warehouse_connection(environment_id: int) -> bool:
    return bool(
        WarehouseConnection.objects.filter(environment_id=environment_id).exists()
    )


@receiver(post_save, sender=EnvironmentAPIKey)
def sync_server_side_key_to_ingestion(
    sender: type[EnvironmentAPIKey],
    instance: EnvironmentAPIKey,
    **kwargs: Any,
) -> None:
    """Keep a server-side key's ingestion whitelisting in step with its validity,
    but only for environments that have a warehouse connection."""
    if not _environment_has_warehouse_connection(instance.environment_id):
        return
    reconcile_server_side_key_ingestion.delay(
        kwargs={"environment_api_key_id": instance.id},
    )


@receiver(post_delete, sender=EnvironmentAPIKey)
def remove_server_side_key_from_ingestion_on_delete(
    sender: type[EnvironmentAPIKey],
    instance: EnvironmentAPIKey,
    **kwargs: Any,
) -> None:
    if not _environment_has_warehouse_connection(instance.environment_id):
        return
    remove_server_side_key_from_ingestion.delay(
        kwargs={"key": instance.key},
    )
