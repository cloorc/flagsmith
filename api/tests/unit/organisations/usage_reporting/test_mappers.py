import pytest
from pytest_mock import MockerFixture

from app_analytics.dataclasses import UsageData
from organisations.models import Organisation
from organisations.usage_reporting import mappers
from organisations.usage_reporting.dataclasses import ProjectUsage
from organisations.usage_reporting.mappers import (
    map_organisation_to_usage_snapshot,
)
from projects.models import Project


@pytest.mark.freeze_time("2026-06-18T09:30:00+00:00")
def test_map_organisation_to_usage_snapshot__with_usage__returns_populated_snapshot(
    organisation: Organisation,
    project: Project,
    mocker: MockerFixture,
) -> None:
    # Given
    mocker.patch.object(mappers, "get_version", return_value="2.142.3")
    mocker.patch.object(
        mappers,
        "get_usage_data_for_window",
        return_value=[
            UsageData(
                day=None,  # type: ignore[arg-type]
                flags=1,
                identities=2,
                traits=3,
                environment_document=4,
            )
        ],
    )

    # When
    snapshot = map_organisation_to_usage_snapshot(organisation)

    # Then
    assert snapshot.timestamp.isoformat() == "2026-06-18T08:00:00+00:00"
    assert snapshot.seat_count == organisation.num_seats
    assert snapshot.instance_version == "2.142.3"
    assert snapshot.api_call_total == 10
    assert snapshot.api_call_breakdown.flags == 1
    assert snapshot.api_call_breakdown.identities == 2
    assert snapshot.api_call_breakdown.traits == 3
    assert snapshot.api_call_breakdown.environment_documents == 4
    assert snapshot.project_count == 1
    assert snapshot.project_usage == [
        ProjectUsage(project_id=project.id, api_call_count=10)
    ]


def test_map_organisation_to_usage_snapshot__no_analytics__returns_zeroed_snapshot(
    organisation: Organisation,
    project: Project,
    mocker: MockerFixture,
) -> None:
    # Given
    mocker.patch.object(mappers, "get_version", return_value="2.142.3")
    mocker.patch.object(mappers, "get_usage_data_for_window", return_value=[])

    # When
    snapshot = map_organisation_to_usage_snapshot(organisation)

    # Then
    assert snapshot.api_call_total == 0
    assert snapshot.api_call_breakdown.flags == 0
    assert snapshot.api_call_breakdown.environment_documents == 0
    assert snapshot.project_count == 1
    assert snapshot.project_usage == [
        ProjectUsage(project_id=project.id, api_call_count=0)
    ]


def test_map_organisation_to_usage_snapshot__excess_projects__keeps_highest_usage(
    organisation: Organisation,
    project: Project,
    project_two: Project,
    mocker: MockerFixture,
) -> None:
    # Given - project_two has more usage than project
    usage_by_project = {
        project.id: [UsageData(day=None, flags=5)],  # type: ignore[arg-type]
        project_two.id: [UsageData(day=None, flags=100)],  # type: ignore[arg-type]
    }
    mocker.patch.object(mappers, "get_version", return_value="2.142.3")
    mocker.patch.object(
        mappers,
        "get_usage_data_for_window",
        side_effect=lambda org, start, stop, project_id=None: usage_by_project.get(
            project_id, []
        ),
    )
    mocker.patch.object(mappers, "MAX_PROJECT_USAGE_ROWS", 1)

    # When
    snapshot = map_organisation_to_usage_snapshot(organisation)

    # Then - only the highest-usage project survives the cap
    assert snapshot.project_usage == [
        ProjectUsage(project_id=project_two.id, api_call_count=100)
    ]
