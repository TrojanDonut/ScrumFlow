from django.urls import path
from . import views

app_name = 'projects'

urlpatterns = [
    path('projects/', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_id>/members/', views.ProjectMemberListCreateView.as_view(), name='project-member-list-create'),
    path('projects/members/', views.ProjectMemberListView.as_view(), name='project-member-list'),
    path('projects/<int:project_id>/members/<int:pk>/', views.ProjectMemberDetailView.as_view(), name='project-member-detail'),
    path('projects/<int:project_id>/wall/', views.ProjectWallPostListCreateView.as_view(), name='project-wall-post-list-create'),
    path('projects/<int:project_id>/wall/<int:post_id>/comments/', views.ProjectWallCommentListCreateView.as_view(), name='project-wall-comment-list-create'),
    path('projects/<int:project_id>/documents/', views.ProjectDocumentListCreateView.as_view(), name='project-document-list-create'),
    path('projects/<int:project_id>/documents/<int:pk>/', views.ProjectDocumentDetailView.as_view(), name='project-document-detail'),
] 