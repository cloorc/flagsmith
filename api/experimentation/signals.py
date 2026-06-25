from typing import Any

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from environments.models import EnvironmentAPIKey
from experimentation.models import WarehouseConnection
from experimentation.tasks import (
    remove_environment_ingestion_key,
    write_environment_ingestion_key,
)


def _environment_has_warehouse_connection(environment_id: int) -> bool:
    return WarehouseConnection.objects.filter(environment_id=environment_id).exists()


@receiver(post_save, sender=EnvironmentAPIKey)
def sync_server_side_key_to_ingestion(
    sender: type[EnvironmentAPIKey],
    instance: EnvironmentAPIKey,
    **kwargs: Any,
) -> None:
    if not _environment_has_warehouse_connection(instance.environment_id):
        return
    write_environment_ingestion_key.delay(
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
    remove_environment_ingestion_key.delay(
        kwargs={"key": instance.key},
    )
