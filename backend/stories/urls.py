from django.urls import path
from . import views

urlpatterns = [
    # User Story endpoints
    path(
        'user-stories/',
        views.UserStoryListCreateView.as_view(),
        name='user-stories-list-create'
    ),
    path(
        'user-stories/<int:pk>/',
        views.UserStoryDetailView.as_view(),
        name='user-story-detail'
    ),
    path(
        'user-stories/<int:story_id>/remove-from-sprint/',
        views.RemoveStoryFromSprintView.as_view(),
        name='remove-story-from-sprint'
    ),
    path(
        'user-stories/<int:story_id>/update-points/',
        views.UserStoryUpdatePointsView.as_view(),
        name='user-story-update-points'
    ),
    path(
        'user-stories/<int:story_id>/update-status/',
        views.UserStoryUpdateStatusView.as_view(),
        name='user-story-update-status'
    ),
    path(
        'backlog/',
        views.UserStoryBacklogView.as_view(),
        name='story-backlog'
    ),
    # Sprint stories endpoint
    path(
        'sprints/<int:sprint_id>/stories/',
        views.SprintStoriesView.as_view(),
        name='sprint-stories'
    ),
]
