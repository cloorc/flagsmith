from pytest_mock import MockerFixture

from environments.models import Environment, EnvironmentAPIKey
from experimentation.models import WarehouseConnection


def test_environment_api_key__created_with_warehouse__enqueues_reconcile(
    warehouse_connection: WarehouseConnection,
    mocker: MockerFixture,
) -> None:
    # Given an environment with a warehouse connection
    environment = warehouse_connection.environment
    mock_task = mocker.patch(
        "experimentation.signals.reconcile_server_side_key_ingestion",
    )

    # When a server-side key is created
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")

    # Then it is reconciled against the ingestion whitelist
    mock_task.delay.assert_called_once_with(
        kwargs={"environment_api_key_id": api_key.id},
    )


def test_environment_api_key__updated_with_warehouse__enqueues_reconcile(
    warehouse_connection: WarehouseConnection,
    mocker: MockerFixture,
) -> None:
    # Given a server-side key on an environment with a warehouse connection
    environment = warehouse_connection.environment
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")
    mock_task = mocker.patch(
        "experimentation.signals.reconcile_server_side_key_ingestion",
    )

    # When the key is deactivated
    api_key.active = False
    api_key.save()

    # Then it is reconciled again so it falls out of the whitelist
    mock_task.delay.assert_called_once_with(
        kwargs={"environment_api_key_id": api_key.id},
    )


def test_environment_api_key__saved_without_warehouse__does_not_enqueue(
    environment: Environment,
    mocker: MockerFixture,
) -> None:
    # Given an environment with no warehouse connection
    mock_task = mocker.patch(
        "experimentation.signals.reconcile_server_side_key_ingestion",
    )

    # When a server-side key is created
    EnvironmentAPIKey.objects.create(environment=environment, name="backend")

    # Then no ingestion work is enqueued
    mock_task.delay.assert_not_called()


def test_environment_api_key__deleted_with_warehouse__enqueues_removal(
    warehouse_connection: WarehouseConnection,
    mocker: MockerFixture,
) -> None:
    # Given a server-side key on an environment with a warehouse connection
    environment = warehouse_connection.environment
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")
    key = api_key.key
    mock_task = mocker.patch(
        "experimentation.signals.remove_server_side_key_from_ingestion",
    )

    # When the key is deleted
    api_key.delete()

    # Then it is removed from the ingestion whitelist
    mock_task.delay.assert_called_once_with(kwargs={"key": key})


def test_environment_api_key__deleted_without_warehouse__does_not_enqueue(
    environment: Environment,
    mocker: MockerFixture,
) -> None:
    # Given a server-side key on an environment with no warehouse connection
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")
    mock_task = mocker.patch(
        "experimentation.signals.remove_server_side_key_from_ingestion",
    )

    # When the key is deleted
    api_key.delete()

    # Then no ingestion work is enqueued
    mock_task.delay.assert_not_called()
