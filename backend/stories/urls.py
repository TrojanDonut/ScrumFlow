from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import UserStoryViewSet

app_name = 'stories'

router = DefaultRouter()
router.register(r'user-stories', UserStoryViewSet, basename='user-story')

urlpatterns = [
    path('projects/<int:project_id>/stories/', views.UserStoryListCreateView.as_view(), name='story-list-create'),
    path('projects/<int:project_id>/stories/<int:pk>/', views.UserStoryDetailView.as_view(), name='story-detail'),
    path('projects/<int:project_id>/stories/<int:story_id>/comments/', views.UserStoryCommentListCreateView.as_view(), name='story-comment-list-create'),
    path('projects/<int:project_id>/sprints/<int:sprint_id>/stories/', views.SprintStoriesView.as_view(), name='sprint-stories'),
    path('projects/<int:project_id>/backlog/', views.ProductBacklogView.as_view(), name='product-backlog'),
    path('projects/<int:project_id>/stories/<int:story_id>/estimate/', views.StoryEstimateView.as_view(), name='story-estimate'),
    path('projects/<int:project_id>/stories/<int:story_id>/planning-poker/', views.PlanningPokerView.as_view(), name='planning-poker'),
    path('projects/<int:project_id>/sprints/<int:sprint_id>/', include(router.urls)),
]
