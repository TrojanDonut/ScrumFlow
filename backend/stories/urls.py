from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import UserStoryViewSet

app_name = 'stories'

router = DefaultRouter()
router.register(r'user-stories', UserStoryViewSet, basename='user-story')

urlpatterns = [
    path('stories/', views.UserStoryListCreateView.as_view(), name='story-list-create'),
    path('stories/<int:pk>/', views.UserStoryDetailView.as_view(), name='story-detail'),
    path('stories/<int:story_id>/comments/', views.UserStoryCommentListCreateView.as_view(), name='story-comment-list-create'),
    path('sprints/<int:sprint_id>/stories/', views.SprintStoriesView.as_view(), name='sprint-stories'),
    path('backlog/', views.UserStoryBacklogView.as_view(), name='story-backlog'),
    path('stories/<int:story_id>/estimate/', views.StoryEstimateView.as_view(), name='story-estimate'),
    path('stories/<int:story_id>/planning-poker/', views.PlanningPokerView.as_view(), name='planning-poker'),
    path('sprints/<int:sprint_id>/', include(router.urls)),
    path('stories/<int:story_id>/remove-from-sprint/', views.RemoveStoryFromSprintView.as_view(), name='remove-story-from-sprint'),
]
