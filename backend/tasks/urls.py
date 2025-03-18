from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    path('stories/<int:story_id>/tasks/', views.TaskListCreateView.as_view(), name='task-list-create'),
    path('stories/<int:story_id>/tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    
    path('tasks/<int:pk>/accept/', views.TaskAcceptView.as_view(), name='task-accept'),
    path('tasks/<int:pk>/reject/', views.TaskRejectView.as_view(), name='task-reject'),
    path('tasks/<int:pk>/complete/', views.TaskCompleteView.as_view(), name='task-complete'),
    # path('tasks/<int:pk>/logs/', views.TimeLogListCreateView.as_view(), name='time-log-list-create'),
    # path('tasks/logs/<int:pk>/', views.TimeLogDetailView.as_view(), name='time-log-detail'),
    # path('user/tasks/', views.UserTasksView.as_view(), name='user-tasks'),
    # path('user/time-logs/', views.UserTimeLogsView.as_view(), name='user-time-logs'),
] 