from rest_framework import generics, status, views, viewsets, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.views import APIView
from .models import UserStory
from .serializers import UserStorySerializer
import logging
from django.shortcuts import get_object_or_404
from projects.models import ProjectMember
from users.permissions import (
    IsProductOwner, 
    IsScrumMaster, 
    IsProductOwnerOrScrumMaster,
    IsScrumMasterOrDeveloper,
    IsProjectMember
)

# Create your logger
logger = logging.getLogger(__name__)

# Custom permission classes for stories
class IsStoryProjectMember(BasePermission):
    """Check if user is a member of the project the story belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # For detail views with a story_id or pk
        story_id = view.kwargs.get('story_id') or view.kwargs.get('pk')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                return ProjectMember.objects.filter(
                    project_id=story.project_id,
                    user=request.user
                ).exists()
            except UserStory.DoesNotExist:
                return False
                
        # For list views (allow all authenticated, filtering happens in queryset)
        return True

class IsStoryProductOwnerOrScrumMaster(BasePermission):
    """Check if user is PO or SM of the project the story belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # For detail views with a story_id or pk
        story_id = view.kwargs.get('story_id') or view.kwargs.get('pk')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                return ProjectMember.objects.filter(
                    project_id=story.project_id,
                    user=request.user,
                    role__in=[ProjectMember.Role.PRODUCT_OWNER, ProjectMember.Role.SCRUM_MASTER]
                ).exists()
            except UserStory.DoesNotExist:
                return False
                
        # For create views, check if PO or SM for the project in request data
        if request.method == 'POST' and 'project' in request.data:
            project_id = request.data.get('project')
            # Convert to int if it's a string
            if isinstance(project_id, str) and project_id.isdigit():
                project_id = int(project_id)
            return ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user,
                role__in=[ProjectMember.Role.PRODUCT_OWNER, ProjectMember.Role.SCRUM_MASTER]
            ).exists()
            
        return False

class IsStoryScrumMaster(BasePermission):
    """Check if user is SM of the project the story belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # For views with a story_id
        story_id = view.kwargs.get('story_id')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                return ProjectMember.objects.filter(
                    project_id=story.project_id,
                    user=request.user,
                    role=ProjectMember.Role.SCRUM_MASTER
                ).exists()
            except UserStory.DoesNotExist:
                return False
                
        # For views with a sprint_id
        sprint_id = view.kwargs.get('sprint_id')
        if sprint_id:
            from sprints.models import Sprint
            try:
                sprint = Sprint.objects.get(id=sprint_id)
                return ProjectMember.objects.filter(
                    project_id=sprint.project_id,
                    user=request.user,
                    role=ProjectMember.Role.SCRUM_MASTER
                ).exists()
            except Sprint.DoesNotExist:
                return False
                
        return False

class IsStoryProductOwner(BasePermission):
    """Check if user is PO of the project the story belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        story_id = view.kwargs.get('story_id')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                return ProjectMember.objects.filter(
                    project_id=story.project_id,
                    user=request.user,
                    role=ProjectMember.Role.PRODUCT_OWNER
                ).exists()
            except UserStory.DoesNotExist:
                return False
                
        return False

class UserStoryListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating user stories."""
    serializer_class = UserStorySerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - List: Any authenticated project member can view stories
        - Create: Only Product Owner and Scrum Master can create stories
        """
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsStoryProductOwnerOrScrumMaster()]

    def get_queryset(self):
        """Return all user stories."""
        return UserStory.objects.all()

    def create(self, request, *args, **kwargs):
        """Create a new user story and set the created_by field."""
        print("Creating story with data:", request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the story with the current user as creator
        story = serializer.save(created_by=request.user)
        print(f"Story created: {story.name}, Project: {story.project_id}, Sprint: {story.sprint_id}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserStoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for retrieving, updating, and deleting a user story."""
    serializer_class = UserStorySerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - Retrieve: Any authenticated project member can view story details
        - Update: Only Product Owner and Scrum Master can update stories
        - Delete: Only Product Owner and Scrum Master can delete stories
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsStoryProjectMember()]
        return [IsAuthenticated(), IsStoryProductOwnerOrScrumMaster()]

    def get_queryset(self):
        """Return the user story based on the URL parameters."""
        story_id = self.kwargs.get('pk') or self.kwargs.get('story_id')
        project_id = self.kwargs.get('project_id')
        sprint_id = self.kwargs.get('sprint_id')

        print(f"Fetching story {story_id} for project {project_id} and sprint {sprint_id}")
        
        # If we have a project_id, filter by project
        if project_id:
            queryset = UserStory.objects.filter(project_id=project_id)
        else:
            queryset = UserStory.objects.all()

        # If we have a sprint_id and it's not 'undefined', filter by sprint
        if sprint_id and sprint_id != 'undefined':
            queryset = queryset.filter(sprint_id=sprint_id)
        
        # Only fetch non-deleted stories
        queryset = queryset.filter(is_deleted=False)
        
        # Filter by story ID
        return queryset.filter(id=story_id)

    def get_object(self):
        """Get the user story object."""
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset)
        print(f"Found story: {obj.name} (ID: {obj.id}, Project: {obj.project_id}, Sprint: {obj.sprint_id})")
        return obj
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy method to handle soft deletion."""
        instance = self.get_object()
        # Instead of deleting, mark as deleted
        instance.is_deleted = True
        instance.save()
        return Response({"message": "Story marked as deleted successfully."}, status=status.HTTP_200_OK)


class RemoveStoryFromSprintView(APIView):
    """API view for removing a story from a sprint."""
    
    def get_permissions(self):
        """Only Scrum Master can remove stories from sprints"""
        return [IsAuthenticated(), IsStoryScrumMaster()]

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
    
    def get_permissions(self):
        """Any authenticated project member can view the backlog"""
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        """Return all user stories in the backlog."""
        return UserStory.objects.filter(sprint=None, is_deleted=False)


class ProjectBacklogView(generics.ListAPIView):
    """API view for listing user stories in a specific project's backlog."""
    serializer_class = UserStorySerializer
    
    def get_permissions(self):
        """Any authenticated project member can view the project backlog"""
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        """Return user stories in the backlog for a specific project."""
        project_id = self.kwargs.get('project_id')
        return UserStory.objects.filter(
            project_id=project_id,
            sprint__isnull=True,  # Not in any sprint
            is_deleted=False
        ).order_by('-created_at')  # Order by most recent first


class UserStoryUpdateStatusView(APIView):
    """API view for updating the status of a user story."""
    
    def get_permissions(self):
        """Only Product Owner can mark stories as accepted/rejected"""
        return [IsAuthenticated(), IsStoryProductOwner()]

    def post(self, request, story_id, *args, **kwargs):
        try:
            status_value = request.data.get('status')
            if not status_value:
                return Response({"error": "Status is required."}, status=status.HTTP_400_BAD_REQUEST)

            story = UserStory.objects.get(id=story_id)
            
            # Validate that only Product Owner can accept/reject stories
            if status_value in [UserStory.Status.ACCEPTED, UserStory.Status.REJECTED]:
                if not ProjectMember.objects.filter(
                    project_id=story.project_id,
                    user=request.user,
                    role=ProjectMember.Role.PRODUCT_OWNER
                ).exists():
                    return Response(
                        {"error": "Only Product Owner can accept or reject stories."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            story.status = status_value
            story.save()
            return Response({"message": "Story status updated successfully."}, status=status.HTTP_200_OK)
        except UserStory.DoesNotExist:
            return Response({"error": "Story not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserStoryUpdatePointsView(APIView):
    """API view for updating the story points of a user story."""
    
    def get_permissions(self):
        """Only Scrum Master can estimate story points"""
        return [IsAuthenticated(), IsStoryScrumMaster()]

    def post(self, request, story_id, *args, **kwargs):
        try:
            points = request.data.get('story_points')
            if points is None:
                return Response({"error": "Story points are required."}, status=status.HTTP_400_BAD_REQUEST)

            story = UserStory.objects.get(id=story_id)
            
            # Ensure story is not already in a sprint
            if story.sprint is not None:
                return Response(
                    {"error": "Cannot update points for a story that is already in a sprint."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            story.story_points = points
            story.save()
            return Response({"message": "Story points updated successfully."}, status=status.HTTP_200_OK)
        except UserStory.DoesNotExist:
            return Response({"error": "Story not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SprintStoriesView(views.APIView):
    """API view for managing user stories in a sprint."""
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - GET: Any authenticated user can view sprint stories
        - POST: Only Scrum Master can add stories to sprint
        """
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsStoryScrumMaster()]

    def get(self, request, sprint_id, *args, **kwargs):
        """Retrieve all user stories for a specific sprint."""
        try:
            stories = UserStory.objects.filter(sprint_id=sprint_id, is_deleted=False)
            serializer = UserStorySerializer(stories, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching stories for sprint {sprint_id}: {e}")
            return Response(
                {"error": "Failed to fetch stories for the sprint."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def post(self, request, sprint_id, *args, **kwargs):
        """Add stories to a sprint."""
        try:
            story_ids = request.data.get('story_ids', [])
            if not story_ids:
                return Response({"error": "No stories provided."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Get stories from IDs
            stories = UserStory.objects.filter(id__in=story_ids)
            
            # Check if all stories have story points
            stories_without_points = [story.id for story in stories if story.story_points is None]
            if stories_without_points:
                return Response(
                    {"error": f"Stories with IDs {stories_without_points} don't have story points."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if stories are already in a sprint
            stories_in_sprint = [story.id for story in stories if story.sprint is not None]
            if stories_in_sprint:
                return Response(
                    {"error": f"Stories with IDs {stories_in_sprint} are already in a sprint."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Update stories with sprint
            for story in stories:
                story.sprint_id = sprint_id
                story.save()
                
            return Response({"message": "Stories added to sprint successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error adding stories to sprint {sprint_id}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserStoryViewSet(viewsets.ModelViewSet):
    queryset = UserStory.objects.all()
    serializer_class = UserStorySerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - List/Retrieve: Any authenticated project member can view stories
        - Create/Update/Delete: Only Product Owner and Scrum Master can modify stories
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProductOwnerOrScrumMaster()]

    def get_queryset(self):
        sprint_id = self.kwargs['sprint_id']
        return self.queryset.filter(sprint_id=sprint_id, is_deleted=False)

    def perform_create(self, serializer):
        """Override to set the created_by field."""
        serializer.save(created_by=self.request.user)
