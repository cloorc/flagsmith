from pytest_mock import MockerFixture

from environments.models import Environment, EnvironmentAPIKey


def test_environment_api_key__created__enqueues_reconcile(
    environment: Environment,
    mocker: MockerFixture,
) -> None:
    # Given
    mock_task = mocker.patch(
        "experimentation.signals.reconcile_server_side_key_ingestion",
    )

    # When
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")

    # Then
    mock_task.delay.assert_called_once_with(
        kwargs={"environment_api_key_id": api_key.id},
    )


def test_environment_api_key__updated__enqueues_reconcile(
    environment: Environment,
    mocker: MockerFixture,
) -> None:
    # Given
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")
    mock_task = mocker.patch(
        "experimentation.signals.reconcile_server_side_key_ingestion",
    )

    # When
    api_key.active = False
    api_key.save()

    # Then
    mock_task.delay.assert_called_once_with(
        kwargs={"environment_api_key_id": api_key.id},
    )


def test_environment_api_key__deleted__enqueues_removal(
    environment: Environment,
    mocker: MockerFixture,
) -> None:
    # Given
    api_key = EnvironmentAPIKey.objects.create(environment=environment, name="backend")
    key = api_key.key
    mock_task = mocker.patch(
        "experimentation.signals.remove_server_side_key_from_ingestion",
    )

    # When
    api_key.delete()

    # Then
    mock_task.delay.assert_called_once_with(kwargs={"key": key})
