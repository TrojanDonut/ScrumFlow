from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import Sprint
from .serializers import SprintSerializer
import logging
from users.permissions import (
    IsProjectMember,
    IsScrumMaster,
)
from stories.models import UserStory

# Create your logger
logger = logging.getLogger(__name__)


class SprintListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all sprints for a project.

    post:
    Create a new sprint for a project.
    """
    serializer_class = SprintSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - List: Any authenticated project member can view sprints
        - Create: Only Scrum Master can create sprints
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsScrumMaster()]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Sprint.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        project_id = self.kwargs['project_id']
        
        # Validate sprint dates
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        
        # Check if end_date is after start_date
        if end_date <= start_date:
            raise serializers.ValidationError(
                {"error": "End date must be after start date."}
            )
            

        
        # Check if start_date is in the past
        if start_date < timezone.now().date():
            raise serializers.ValidationError(
                {"error": "Start date cannot be in the past."}
            )
        
              
        # Check for overlapping sprints
        overlapping_sprints = Sprint.objects.filter(
            project_id=project_id
        ).filter(
            Q(start_date__range=(start_date, end_date)) | 
            Q(end_date__range=(start_date, end_date)) |
            Q(start_date__lte=start_date, end_date__gte=end_date)
        )
        
        if overlapping_sprints.exists():
            raise serializers.ValidationError(
                {"error": "Sprint dates overlap with existing sprints."}
            )
        
        serializer.save(project_id=project_id)


class SprintDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific sprint.

    put:
    Update the details of a specific sprint.

    patch:
    Partially update the details of a specific sprint.

    delete:
    Delete a specific sprint.
    """
    serializer_class = SprintSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - Retrieve: Any authenticated project member can view sprint details
        - Update/Delete: Only Scrum Master can modify sprints
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsScrumMaster()]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Sprint.objects.filter(project_id=project_id)
    
    def update(self, request, *args, **kwargs):
        """Custom update to validate sprint dates and status"""
        instance = self.get_object()
        
        # Validate that sprint hasn't started yet
        if 'start_date' in request.data or 'end_date' in request.data:
            if instance.start_date <= timezone.now().date():
                return Response(
                    {
                        "error": "Cannot modify dates of a sprint that has already started."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Continue with normal update
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Custom destroy to validate sprint status"""
        instance = self.get_object()
        
        # Check if sprint has already started
        if instance.start_date <= timezone.now().date():
            return Response(
                {"error": "Cannot delete a sprint that has already started."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)


class ActiveSprintView(generics.RetrieveAPIView):
    """
    get:
    Return the active sprint for a project.
    """
    serializer_class = SprintSerializer
    
    def get_permissions(self):
        """Any authenticated project member can view the active sprint"""
        return [IsAuthenticated(), IsProjectMember()]

    def get_object(self):
        project_id = self.kwargs['project_id']
        now = timezone.now().date()
        
        try:
            return Sprint.objects.get(
                project_id=project_id,
                start_date__lte=now,
                end_date__gte=now
            )
        except Sprint.DoesNotExist:
            return Response(
                {"error": "No active sprint found for this project."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Sprint.MultipleObjectsReturned:
            # In case of multiple active sprints (shouldn't happen, but just in case)
            return Sprint.objects.filter(
                project_id=project_id,
                start_date__lte=now,
                end_date__gte=now
            ).first()


class FinishSprintView(generics.GenericAPIView):
    """
    post:
    Finish a sprint by updating its completion status.
    Should be called at the end of a sprint.
    """
    serializer_class = SprintSerializer
    
    def get_permissions(self):
        """Only Scrum Master can complete sprints"""
        return [IsAuthenticated(), IsScrumMaster()]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Sprint.objects.filter(project_id=project_id)
    
    def post(self, request, *args, **kwargs):
        sprint = self.get_object()
        
        # Check if all stories have been accepted/rejected
        incomplete_stories = sprint.user_stories.exclude(
            status__in=[
                UserStory.Status.ACCEPTED, 
                UserStory.Status.REJECTED
            ]
        )
        
        if incomplete_stories.exists():
            return Response(
                {
                    "error": "Cannot finish sprint. There are incomplete stories."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Mark sprint as completed
        sprint.is_completed = True
        sprint.save()
        
        return Response({"message": "Sprint finished successfully."})


class UpcomingSprintView(generics.RetrieveAPIView):
    """
    get:
    Return the upcoming sprint for a project.
    """
    serializer_class = SprintSerializer
    
    def get_permissions(self):
        """Any authenticated project member can view upcoming sprints"""
        return [IsAuthenticated(), IsProjectMember()]

    def get_object(self):
        project_id = self.kwargs['project_id']
        now = timezone.now().date()
        
        try:
            return Sprint.objects.filter(
                project_id=project_id,
                start_date__gt=now
            ).order_by('start_date').first()
        except Sprint.DoesNotExist:
            return Response(
                {"error": "No upcoming sprint found for this project."},
                status=status.HTTP_404_NOT_FOUND
            )


