from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from tasks.models import Task, TimeLog
from stories.models import UserStory
from tasks.serializers import TaskSerializer, TimeLogSerializer
import logging
from projects.models import ProjectMember
from decimal import Decimal

# Create your logger
logger = logging.getLogger(__name__)


# Custom task permissions
class IsTaskProjectMember(BasePermission):
    """Check if user is a member of the project the task belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # For views with task_id parameter
        task_id = view.kwargs.get('task_id') or view.kwargs.get('pk')
        if task_id:
            try:
                task = Task.objects.get(id=task_id)
                story = task.story
                project_id = story.project.id if story.project else story.sprint.project.id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user
                ).exists()
            except Task.DoesNotExist:
                return False
                
        # For views with project_id parameter
        project_id = view.kwargs.get('project_id')
        if project_id:
            return ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user
            ).exists()
            
        # For views with story_id parameter
        story_id = view.kwargs.get('story_id')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                project_id = story.project.id if story.project else story.sprint.project.id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user
                ).exists()
            except UserStory.DoesNotExist:
                return False
        
        return True  # For list views, filtering happens in queryset


class IsTaskScrumMaster(BasePermission):
    """Check if user is the Scrum Master of the project the task belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # For views with task_id parameter
        task_id = view.kwargs.get('task_id') or view.kwargs.get('pk')
        if task_id:
            try:
                task = Task.objects.get(id=task_id)
                story = task.story
                project_id = story.project.id if story.project else story.sprint.project.id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user,
                    role=ProjectMember.Role.SCRUM_MASTER
                ).exists()
            except Task.DoesNotExist:
                return False
                
        # For views with project_id parameter
        project_id = view.kwargs.get('project_id')
        if project_id:
            return ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user,
                role=ProjectMember.Role.SCRUM_MASTER
            ).exists()
            
        # For views with story_id parameter
        story_id = view.kwargs.get('story_id')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                project_id = story.project.id if story.project else story.sprint.project.id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user,
                    role=ProjectMember.Role.SCRUM_MASTER
                ).exists()
            except UserStory.DoesNotExist:
                return False
        
        return False


class IsTaskScrumMasterOrDeveloper(BasePermission):
    """Check if user is a Scrum Master or Developer of the project the task belongs to"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # For views with task_id parameter
        task_id = view.kwargs.get('task_id') or view.kwargs.get('pk')
        if task_id:
            try:
                task = Task.objects.get(id=task_id)
                story = task.story
                project_id = story.project.id if story.project else story.sprint.project.id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user,
                    role__in=[ProjectMember.Role.SCRUM_MASTER, ProjectMember.Role.DEVELOPER]
                ).exists()
            except Task.DoesNotExist:
                return False
                
        # For views with project_id parameter
        project_id = view.kwargs.get('project_id')
        if project_id:
            return ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user,
                role__in=[ProjectMember.Role.SCRUM_MASTER, ProjectMember.Role.DEVELOPER]
            ).exists()
            
        # For views with story_id parameter
        story_id = view.kwargs.get('story_id')
        if story_id:
            try:
                story = UserStory.objects.get(id=story_id)
                project_id = story.project.id if story.project else story.sprint.project.id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user,
                    role__in=[ProjectMember.Role.SCRUM_MASTER, ProjectMember.Role.DEVELOPER]
                ).exists()
            except UserStory.DoesNotExist:
                return False
        
        return False


class TaskListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all tasks.

    post:
    Create a new task instance.
    """
    serializer_class = TaskSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - List: Any authenticated project member can view tasks
        - Create: Only Scrum Master and Developers can create tasks
        """
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTaskScrumMasterOrDeveloper()]

    def get_queryset(self):
        return Task.objects.all(is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the given task.

    put:
    Update the given task.

    patch:
    Partially update the given task.

    delete:
    Delete the given task.
    """
    serializer_class = TaskSerializer
    
    def get_permissions(self):
        """Any authenticated project member can view, update and delete tasks (#15)"""
        return [IsAuthenticated(), IsTaskProjectMember()]

    def get_queryset(self):
        return Task.objects.filter(is_deleted=False)
    
    def get_object(self):
        obj = super().get_object()
        return obj
    
    def perform_destroy(self, instance):
        """Override destroy to perform a soft delete."""
        instance.delete()


class ProjectTasksView(generics.ListAPIView):
    """
    get:
    Return a list of all tasks for all user stories belonging to a specific project.
    """
    serializer_class = TaskSerializer
    
    def get_permissions(self):
        """Any authenticated project member can view tasks"""
        return [IsAuthenticated(), IsTaskProjectMember()]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Task.objects.filter(
            story__project_id=project_id,
            is_deleted=False
        ) | Task.objects.filter(
            story__project_id__isnull=True,
            story__sprint__project_id=project_id
        )


class StoryTasksView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all tasks for a specific story.

    post:
    Create a new task for a specific story.
    """
    serializer_class = TaskSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - List: Any authenticated project member can view tasks
        - Create: Only Scrum Master and Developers can create tasks
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsTaskProjectMember()]
        return [IsAuthenticated(), IsTaskScrumMasterOrDeveloper()]
    
    def get_queryset(self):
        story_id = self.kwargs['story_id']
        return Task.objects.filter(story_id=story_id, is_deleted=False)
    
    def perform_create(self, serializer):
        story_id = self.kwargs['story_id']
        title = self.request.data.get('title')
        
        if Task.objects.filter(story_id=story_id, title__iexact=title).exists():
            raise ValidationError({"error": "A task with this name already exists for this story"})
        
        # story = get_object_or_404(UserStory, id=story_id)
        serializer.save(story_id=story_id, created_by=self.request.user)


class TaskAssignView(views.APIView):
    """
    post:
    Assign a task to the current user.
    """
    
    def get_permissions(self):
        """Only Developers can self-assign tasks"""
        return [IsAuthenticated(), IsTaskScrumMasterOrDeveloper()]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Check if task is already assigned
        if task.assigned_to and task.assigned_to != request.user:
            return Response(
                {"error": "Task is already assigned to another user."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        task.assigned_to = request.user
        task.status = Task.Status.ASSIGNED
        task.save()
        
        serializer = TaskSerializer(task)
        return Response(serializer.data)


class TaskUnassignView(views.APIView):
    """
    post:
    Unassign a task from the current user.
    """
    
    def get_permissions(self):
        """Only task assignee or Scrum Master can unassign tasks"""
        return [IsAuthenticated()]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Check if user is the assignee or Scrum Master
        if task.assigned_to != request.user:
            # Get project ID from the task's story
            story = task.story
            project_id = story.project.id if story.project else story.sprint.project.id
            
            # Check if user is Scrum Master
            is_scrum_master = ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user,
                role=ProjectMember.Role.SCRUM_MASTER
            ).exists()
            
            if not is_scrum_master:
                return Response(
                    {"error": "Only the assigned user or Scrum Master can unassign tasks."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        # Unassign the task
        task.assigned_to = None
        task.status = Task.Status.UNASSIGNED
        task.save()
        
        serializer = TaskSerializer(task)
        return Response(serializer.data)

class TaskAcceptView(views.APIView):
    """
    post:
    Marks task as 'in progress' by current user.
    """
    
    def get_permissions(self):
        return [IsAuthenticated()]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Check if the task is assigned to a different user
        if task.assigned_to and task.assigned_to != request.user:
            return Response(
                {"error": "Task is already assigned to another user."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        task.status = Task.Status.IN_PROGRESS
        task.save()
        
        serializer = TaskSerializer(task)
        return Response(serializer.data)

class TaskStartView(views.APIView):
    """
    post:
    Start working on a task.
    """
    
    def get_permissions(self):
        """Only task assignee can start working on a task"""
        return [IsAuthenticated()]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Check if user is the assignee
        if task.assigned_to != request.user:
            return Response(
                {"error": "Only the assigned user can start working on this task."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if task is already completed
        if task.status == Task.Status.COMPLETED:
            return Response(
                {"error": "Cannot start work on a completed task."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update task status
        task.status = Task.Status.IN_PROGRESS
        task.save()
        
        return Response({
            "message": "Started working on task."
        })


class TaskStopView(views.APIView):
    """
    post:
    Stop working on a task.
    """
    
    def get_permissions(self):
        """Only task assignee can stop working on a task"""
        return [IsAuthenticated()]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Check if user is the assignee
        if task.assigned_to != request.user:
            return Response(
                {"error": "Only the assigned user can stop working on this task."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if task is in progress
        if task.status != Task.Status.IN_PROGRESS:
            return Response(
                {"error": "Task is not currently in progress."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Create a time log entry without changing task status
        if 'hours_spent' in request.data:
            TimeLog.objects.create(
                task=task,
                user=request.user,
                hours_spent=request.data['hours_spent'],
                date=timezone.now().date(),
                description=request.data.get('description', '')
            )
        
        task = get_object_or_404(Task, id=task_id)    
        serializer = TaskSerializer(task)
        return Response(serializer.data)


class TaskCompleteView(views.APIView):
    """
    post:
    Mark a task as complete.
    """
    
    def get_permissions(self):
        """Only task assignee and Scrum Master can complete tasks"""
        return [IsAuthenticated()]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Check if user is the assignee or Scrum Master
        if task.assigned_to != request.user:
            # Get project ID from the task's story
            story = task.story
            project_id = story.project.id if story.project else story.sprint.project.id
            
            # Check if user is Scrum Master
            is_scrum_master = ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user,
                role=ProjectMember.Role.SCRUM_MASTER
            ).exists()
            
            if not is_scrum_master:
                return Response(
                    {"error": "Only the assigned user or Scrum Master can complete tasks."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        final_estimated_hours = float(request.data.get('final_estimated_hours'))
        if final_estimated_hours is not None:
            try:
                final_estimated_hours = Decimal(final_estimated_hours)
                task.estimated_hours = final_estimated_hours
            except (ValueError, TypeError, Decimal.InvalidOperation):
                return Response(
                    {"error": "Invalid value for final_estimated_hours."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        task.status = Task.Status.COMPLETED
        task.save()
        
        task = get_object_or_404(Task, id=task_id)
        task.remaining_hours = 0
        task.save()
        
        # Create a time log entry if hours spent was provided
        if 'hours_spent' in request.data:
            TimeLog.objects.create(
                task=task,
                user=request.user if task.assigned_to == request.user else task.assigned_to,
                hours_spent=request.data['hours_spent'],
                date=timezone.now().date(),
                description=request.data.get('description', 'Task completed')
            )
        
        serializer = TaskSerializer(task)
        return Response(serializer.data)


class TimeLogListView(generics.ListAPIView):
    """
    get:
    Return a list of time logs for a task.
    """
    serializer_class = TimeLogSerializer
    
    def get_permissions(self):
        """Project members can view time logs"""
        return [IsAuthenticated(), IsTaskProjectMember()]
    
    def get_queryset(self):
        task_id = self.kwargs['task_id']
        return TimeLog.objects.filter(task_id=task_id)


class UserTimeLogListView(generics.ListAPIView):
    """
    get:
    Return a list of time logs for the current user.
    """
    serializer_class = TimeLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return TimeLog.objects.filter(user=user)


class StartTaskSessionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = get_object_or_404(Task, id=task_id)
            
            # Check if user is the assignee
            if task.assigned_to != request.user:
                return Response(
                    {"error": "Only the assigned user can start a session for this task."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Check if task is not in progress yet
            if task.status != Task.Status.IN_PROGRESS:
                # Update task status to IN_PROGRESS
                task.status = Task.Status.IN_PROGRESS
                task.save()
                
            # Start a new session or get existing active session
            session = task.start_session(request.user)
            
            # Check if a session was created or already active
            if session:
                return Response({
                    "success": True,
                    "message": "Task session started.",
                    "session_id": session.id,
                    "start_time": session.start_time
                })
            else:
                return Response({
                    "error": "Failed to start session. Please try again."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error starting task session: {str(e)}")
            return Response({
                "error": f"An error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StopTaskSessionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = get_object_or_404(Task, id=task_id)
            
            # Check if user is the assignee
            if task.assigned_to != request.user:
                return Response(
                    {"error": "Only the assigned user can stop a session for this task."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Only proceed if task is in progress
            if task.status != Task.Status.IN_PROGRESS:
                return Response(
                    {"error": "Task is not currently in progress."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Try to stop the active session
            session_stopped = task.stop_session(request.user)
            
            if session_stopped:
                # Get the time log that was just created
                latest_log = TimeLog.objects.filter(
                    task=task,
                    user=request.user
                ).order_by('-created_at').first()
                
                return Response({
                    "success": True,
                    "message": "Task session stopped and time logged.",
                    "hours_logged": latest_log.hours_spent if latest_log else 0
                })
            else:
                return Response({
                    "error": "No active session found to stop.",
                    "success": False
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error stopping task session: {str(e)}")
            return Response({
                "error": f"An error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)