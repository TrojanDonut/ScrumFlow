from rest_framework import generics, status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import UserStory
from .serializers import UserStorySerializer
import logging

# Create your logger
logger = logging.getLogger(__name__)


class UserStoryListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating user stories."""
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return all user stories."""
        return UserStory.objects.all()

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
        return Response(
            {"message": "Not implemented yet"},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

class RemoveStoryFromSprintView(APIView):
    """API view for removing a story from a sprint."""
    permission_classes = [IsAuthenticated]

    def post(self, request, story_id, *args, **kwargs):
        try:
            story = UserStory.objects.get(id=story_id)
            story.sprint = None
            story.save()
            return Response({"message": "Story removed from sprint successfully."}, status=status.HTTP_200_OK)
        except UserStory.DoesNotExist:
            return Response({"error": "Story not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserStoryBacklogView(generics.ListAPIView):
    """API view for listing user stories in the backlog."""
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return all user stories in the backlog."""
        return UserStory.objects.filter(sprint=None)


class UserStoryCommentListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating comments on user stories."""
    # serializer_class = UserStoryCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return comments for a specific story."""
        # Commented to avoid unused variable warning
        # story_id = self.kwargs['story_id']
        # return UserStoryComment.objects.filter(story_id=story_id)
        return []

    def create(self, request, *args, **kwargs):
        """Create method is not implemented yet."""
        return Response(
            {"message": "Not implemented yet"},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class SprintStoriesView(views.APIView):
    """API view for managing stories in a sprint."""
    permission_classes = [IsAuthenticated]

    def get(self, request, sprint_id, *args, **kwargs):
        """Retrieve all user stories for a specific sprint."""
        try:
            stories = UserStory.objects.filter(sprint_id=sprint_id)
            serializer = UserStorySerializer(stories, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching stories for sprint {sprint_id}: {e}")
            return Response(
                {"error": "Failed to fetch stories for the sprint."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StoryEstimateView(views.APIView):
    """API view for estimating user stories."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Post method is not implemented yet."""
        return Response(
            {"message": "Not implemented yet"},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class PlanningPokerView(views.APIView):
    """API view for planning poker sessions."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get method is not implemented yet."""
        return Response(
            {"message": "Not implemented yet"},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )

    def post(self, request, *args, **kwargs):
        """Post method is not implemented yet."""
        return Response(
            {"message": "Not implemented yet"},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class UserStoryViewSet(viewsets.ModelViewSet):
    queryset = UserStory.objects.all()
    serializer_class = UserStorySerializer

    def get_queryset(self):
        sprint_id = self.kwargs['sprint_id']
        return self.queryset.filter(sprint_id=sprint_id)

    def perform_create(self, serializer):
        """Override to set the created_by field."""
        serializer.save(created_by=self.request.user)
