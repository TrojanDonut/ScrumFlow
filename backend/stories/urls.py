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
    path(
        'projects/<int:project_id>/backlog/',
        views.ProjectBacklogView.as_view(),
        name='project-backlog'
    ),
    # Sprint stories endpoint
    path(
        'sprints/<int:sprint_id>/stories/',
        views.SprintStoriesView.as_view(),
        name='sprint-stories'
    ),
    path('stories/<int:story_id>/move-to-sprint/<int:sprint_id>/', views.MoveStoryToSprintView.as_view(), name='move-story-to-sprint'),
    path('stories/<int:story_id>/mark-as-realized/', views.MarkStoryAsRealizedView.as_view(), name='mark-story-as-realized'),
    path(
        'projects/<int:project_id>/sprints/<int:sprint_id>/return-stories/',
        views.ReturnStoriesToBacklogView.as_view(),
        name='return-stories-to-backlog'
    ),
]
