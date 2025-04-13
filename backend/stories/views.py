from rest_framework import generics, status, views, viewsets, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import UserStory
from .serializers import UserStorySerializer
import logging
from django.shortcuts import get_object_or_404
from users.permissions import (
    IsProjectMember, 
    IsProductOwnerOrScrumMaster, 
    IsScrumMaster,
    IsProjectMemberFromSprint,
    IsScrumMasterFromSprint
)

# Create your logger
logger = logging.getLogger(__name__)


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
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProductOwnerOrScrumMaster()]

    def get_queryset(self):
        """Return all user stories."""
        return UserStory.objects.all()

    def create(self, request, *args, **kwargs):
        """Create a new user story and set the created_by field."""
        print("Creating story with data:", request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Ensure project is set
        if 'project' not in request.data:
            return Response(
                {"error": "Project ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
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
        - Update/Delete: Only Product Owner and Scrum Master can modify stories
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProductOwnerOrScrumMaster()]

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
        return [IsAuthenticated(), IsScrumMasterFromSprint()]
    
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
        """Any project member can view the backlog"""
        return [IsAuthenticated(), IsProjectMember()]
    
    def get_queryset(self):
        """Return all user stories in the backlog."""
        return UserStory.objects.filter(sprint=None, is_deleted=False)


class ProjectBacklogView(generics.ListAPIView):
    """API view for listing user stories in the backlog for a specific project."""
    serializer_class = UserStorySerializer
    
    def get_permissions(self):
        """Any project member can view the project backlog"""
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        """Return all user stories in the backlog for a specific project."""
        project_id = self.kwargs.get('project_id')
        print(f"Fetching backlog stories for project {project_id}")
        
        # Get all stories for the project
        all_stories = UserStory.objects.filter(project_id=project_id)
        
        # Exclude deleted stories
        all_stories = all_stories.filter(is_deleted=False)
        
        print(f"Total stories for project: {all_stories.count()}")
        
        # No longer filtering out stories with sprints
        # We're returning all stories now, categorization will be done in list()
        return all_stories.order_by('priority', '-business_value')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Categorizing stories according to the new requirements
        stories = serializer.data
        
        # Divide stories into finished and unrealized
        finished_stories = [story for story in stories if story['status'] == 'ACCEPTED']
        unrealized_stories = [story for story in stories if story['status'] != 'ACCEPTED']
        
        # Divide unrealized stories into active (in a sprint) and unactive (not in a sprint)
        active_stories = [story for story in unrealized_stories if story['sprint'] is not None]
        unactive_stories = [story for story in unrealized_stories if story['sprint'] is None]
        
        # Prepare the response data structure
        response_data = {
            'finished': finished_stories,
            'unrealized': {
                'active': active_stories,
                'unactive': unactive_stories
            }
        }
        
        print(f"Returning categorized stories: {len(finished_stories)} finished, {len(active_stories)} active unrealized, {len(unactive_stories)} unactive unrealized")
        
        return Response(response_data)


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
    
    def get_permissions(self):
        """Any project member can view stories in a sprint"""
        return [IsAuthenticated(), IsProjectMemberFromSprint()]

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
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - List/Retrieve: Any authenticated project member can view stories
        - Create/Update/Delete: Only Product Owner and Scrum Master can modify stories
        """
        if self.request.method in ['GET']:
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProductOwnerOrScrumMaster()]

    def get_queryset(self):
        sprint_id = self.kwargs['sprint_id']
        return self.queryset.filter(sprint_id=sprint_id, is_deleted=False)

    def perform_create(self, serializer):
        """Override to set the created_by field."""
        serializer.save(created_by=self.request.user)


class UserStoryUpdatePointsView(APIView):
    """API view for updating story points for a user story."""
    permission_classes = [IsAuthenticated]

    def post(self, request, story_id, *args, **kwargs):
        """Update story points for a user story."""
        try:
            story = UserStory.objects.get(id=story_id, is_deleted=False)
            
            # Get story points from request data
            story_points = request.data.get('story_points')
            
            if story_points is None:
                return Response(
                    {"error": "Story points are required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Update story points
            story.story_points = story_points
            story.save()
            
            serializer = UserStorySerializer(story)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except UserStory.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating story points for story {story_id}: {e}")
            return Response(
                {"error": f"Failed to update story points: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserStoryUpdateStatusView(APIView):
    """API view for updating status for a user story."""
    permission_classes = [IsAuthenticated]

    def post(self, request, story_id, *args, **kwargs):
        """Update status for a user story."""
        try:
            story = UserStory.objects.get(id=story_id, is_deleted=False)
            
            # Get status from request data
            status_value = request.data.get('status')
            
            if status_value is None:
                return Response(
                    {"error": "Status is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Validate status
            if status_value not in [choice[0] for choice in UserStory.Status.choices]:
                return Response(
                    {"error": f"Invalid status. Valid options are: {', '.join([choice[0] for choice in UserStory.Status.choices])}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Update status
            story.status = status_value
            story.save()
            
            serializer = UserStorySerializer(story)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except UserStory.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error updating status for story {story_id}: {e}")
            return Response(
                {"error": f"Failed to update status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MoveStoryToSprintView(APIView):
    """API view for moving a story to a specific sprint."""
    
    def get_permissions(self):
        """Only Scrum Master can move stories to sprints"""
        return [IsAuthenticated(), IsScrumMasterFromSprint()]

    def post(self, request, story_id, sprint_id, *args, **kwargs):
        """Move a story to a specific sprint."""
        try:
            story = UserStory.objects.get(id=story_id, is_deleted=False)
            
            from sprints.models import Sprint
            sprint = Sprint.objects.get(id=sprint_id)
            
            # Move story to sprint
            story.sprint = sprint
            story.save()
            
            serializer = UserStorySerializer(story)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except UserStory.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Sprint.DoesNotExist:
            return Response(
                {"error": "Sprint not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error moving story {story_id} to sprint {sprint_id}: {e}")
            return Response(
                {"error": f"Failed to move story to sprint: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MarkStoryAsRealizedView(APIView):
    """API view for marking a story as realized (ACCEPTED status)."""
    
    def get_permissions(self):
        """Only Scrum Master can mark stories as realized"""
        return [IsAuthenticated(), IsScrumMasterFromSprint()]

    def post(self, request, story_id, *args, **kwargs):
        """Mark a story as realized."""
        try:
            story = UserStory.objects.get(id=story_id, is_deleted=False)
            
            # Mark story as realized (ACCEPTED)
            story.status = UserStory.Status.ACCEPTED
            story.save()
            
            serializer = UserStorySerializer(story)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except UserStory.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error marking story {story_id} as realized: {e}")
            return Response(
                {"error": f"Failed to mark story as realized: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
