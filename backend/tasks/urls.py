from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    path(
        'tasks/',
        views.TaskListCreateView.as_view(),
        name='tasks-list-create'
    ),
    path(
        'tasks/<int:pk>/',
        views.TaskDetailView.as_view(),
        name='task-detail'
    ),
    path(
        'stories/<int:story_id>/tasks/',
        views.StoryTasksView.as_view(),
        name='story-tasks'
    ),
    path(
        'projects/<int:project_id>/tasks/',
        views.ProjectTasksView.as_view(),
        name='project-tasks'
    ),
    path(
        'tasks/<int:task_id>/assign/',
        views.TaskAssignView.as_view(),
        name='task-assign'
    ),
    path(
        'tasks/<int:task_id>/unassign/',
        views.TaskUnassignView.as_view(),
        name='task-unassign'
    ),
    path(
        'tasks/<int:task_id>/accept/',
        views.TaskAcceptView.as_view(),
        name='task-accept'
    ),
    path(
        'tasks/<int:task_id>/start/',
        views.TaskStartView.as_view(),
        name='task-start'
    ),
    path(
        'tasks/<int:task_id>/stop/',
        views.TaskStopView.as_view(),
        name='task-stop'
    ),
    path(
        'tasks/<int:task_id>/complete/',
        views.TaskCompleteView.as_view(),
        name='task-complete'
    ),
    path(
        'tasks/<int:task_id>/logs/',
        views.TimeLogListView.as_view(),
        name='task-timelogs'
    ),
    path(
        'user/timelogs/',
        views.UserTimeLogListView.as_view(),
        name='user-timelogs'
    ),
    path('tasks/<int:task_id>/start-session/', views.StartTaskSessionView.as_view(), name='start-task-session'),
    path('tasks/<int:task_id>/stop-session/', views.StopTaskSessionView.as_view(), name='stop-task-session'),
]
