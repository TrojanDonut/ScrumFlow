from django.urls import path
from . import views
from .views import SprintListCreateView

app_name = 'sprints'

urlpatterns = [
    path('projects/<int:project_id>/sprints/', views.SprintListCreateView.as_view(), name='sprint-list-create'),
    path('projects/<int:project_id>/sprints/<int:pk>/', views.SprintDetailView.as_view(), name='sprint-detail'),
    #path('api/projects/<int:project_id>/active-sprint/', views.ActiveSprintView.as_view(), name='active-sprint'),
]
