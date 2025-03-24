from rest_framework import generics, status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

# Create your logger
logger = logging.getLogger(__name__)

# Placeholder for Story model and serializer imports
from .models import UserStory
from .serializers import UserStorySerializer

class UserStoryListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating user stories."""
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return stories for a specific project."""
        project_id = self.kwargs['project_id']
        return UserStory.objects.filter(project_id=project_id)

    def create(self, request, *args, **kwargs):
        """Create a new user story and set the created_by field."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)  # Ensure created_by is set
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserStoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for retrieving, updating, and deleting a user story."""
    queryset = UserStory.objects.all()
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class UserStoryCommentListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating comments on user stories."""
    # serializer_class = UserStoryCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return comments for a specific story."""
        story_id = self.kwargs['story_id']
        # return UserStoryComment.objects.filter(story_id=story_id)
        return []

    def create(self, request, *args, **kwargs):
        """Create method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class SprintStoriesView(views.APIView):
    """API view for managing stories in a sprint."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class ProductBacklogView(views.APIView):
    """API view for managing the product backlog."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class StoryEstimateView(views.APIView):
    """API view for estimating user stories."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Post method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class PlanningPokerView(views.APIView):
    """API view for planning poker sessions."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def post(self, request, *args, **kwargs):
        """Post method is not implemented yet."""
        return Response({"message": "Not implemented yet"}, status=status.HTTP_501_NOT_IMPLEMENTED)

class UserStoryViewSet(viewsets.ModelViewSet):
    queryset = UserStory.objects.all()
    serializer_class = UserStorySerializer

    def get_queryset(self):
        sprint_id = self.kwargs['sprint_id']
        return self.queryset.filter(sprint_id=sprint_id)

    def perform_create(self, serializer):
        """Override to set the created_by field."""
        serializer.save(created_by=self.request.user)