from typing import Any

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from environments.models import EnvironmentAPIKey
from experimentation.tasks import (
    reconcile_server_side_key_ingestion,
    remove_server_side_key_from_ingestion,
)


@receiver(post_save, sender=EnvironmentAPIKey)
def sync_server_side_key_to_ingestion(
    sender: type[EnvironmentAPIKey],
    instance: EnvironmentAPIKey,
    **kwargs: Any,
) -> None:
    reconcile_server_side_key_ingestion.delay(
        kwargs={"environment_api_key_id": instance.id},
    )


@receiver(post_delete, sender=EnvironmentAPIKey)
def remove_server_side_key_from_ingestion_on_delete(
    sender: type[EnvironmentAPIKey],
    instance: EnvironmentAPIKey,
    **kwargs: Any,
) -> None:
    remove_server_side_key_from_ingestion.delay(
        kwargs={"key": instance.key},
    )
