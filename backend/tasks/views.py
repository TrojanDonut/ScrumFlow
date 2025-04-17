from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.shortcuts import get_object_or_404
from django.utils import timezone
from tasks.models import Task, TimeLog
from stories.models import UserStory
from tasks.serializers import TaskSerializer, TimeLogSerializer
import logging
from projects.models import ProjectMember

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
        return Task.objects.all()

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
        """
        Get permissions based on the request method:
        - Retrieve: Any authenticated project member can view task details
        - Update: Only Scrum Master and task assignee can update tasks
        - Delete: Only Scrum Master can delete tasks
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsTaskProjectMember()]
        elif self.request.method == 'DELETE':
            return [IsAuthenticated(), IsTaskScrumMaster()]
        else:  # PUT, PATCH
            # Using a custom permission check in get_object()
            return [IsAuthenticated()]

    def get_queryset(self):
        return Task.objects.all()
    
    def get_object(self):
        obj = super().get_object()
        
        # For PUT/PATCH, check if user is task assignee or Scrum Master
        if self.request.method in ['PUT', 'PATCH']:
            # Get project ID from the task's story
            story = obj.story
            project_id = story.project.id if story.project else story.sprint.project.id
            
            # Check if user is Scrum Master
            is_scrum_master = ProjectMember.objects.filter(
                project_id=project_id,
                user=self.request.user,
                role=ProjectMember.Role.SCRUM_MASTER
            ).exists()
            
            # Check if user is the assignee
            is_assignee = obj.assigned_to == self.request.user
            
            if not (is_scrum_master or is_assignee):
                self.permission_denied(
                    self.request,
                    message="You must be the Scrum Master or the task assignee to update this task."
                )
                
        return obj


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
            story__project_id=project_id
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
        return Task.objects.filter(story_id=story_id)
    
    def perform_create(self, serializer):
        story_id = self.kwargs['story_id']
        story = get_object_or_404(UserStory, id=story_id)
        
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
            
        # Update task status back to assigned
        task.status = Task.Status.ASSIGNED
        task.save()
        
        # Create a time log entry
        if 'hours_spent' in request.data:
            TimeLog.objects.create(
                task=task,
                user=request.user,
                hours_spent=request.data['hours_spent'],
                date=timezone.now().date(),
                description=request.data.get('description', '')
            )
            
        return Response({
            "message": "Stopped working on task."
        })


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
                
        # Update task status
        task.status = Task.Status.COMPLETED
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
        
        return Response({"message": "Task marked as complete."})


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
        task = Task.objects.get(id=task_id)
        task.start_session(request.user)
        return Response({"message": "Task session started."})

class StopTaskSessionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        task = Task.objects.get(id=task_id)
        task.stop_session(request.user)
        return Response({"message": "Task session stopped and time logged."})