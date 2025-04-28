from django.db import models
from django.db.models import F
from django.conf import settings
from django.core.validators import MinValueValidator
from stories.models import UserStory
from django.utils import timezone


class TaskManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class Task(models.Model):
    """Task model for breaking down user stories into smaller units of work"""

    class Status(models.TextChoices):
        UNASSIGNED = 'UNASSIGNED', 'Unassigned'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'

    story = models.ForeignKey(UserStory, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200, default=None)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNASSIGNED)
    is_deleted = models.BooleanField(default=False)
    estimated_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.00)],
        null=False,
        blank=False,
        default=0.00,
    )
    remaining_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=False,
        blank=False,
        default=0.00,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        unique_together = ('title', 'story')

    def __str__(self):
        return f"{self.description[:50]}... ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Set remaining hours to estimated hours on creation
        if not self.pk:
            self.remaining_hours = self.estimated_hours
        
        if self.pk:
            original = Task.objects.get(pk=self.pk)
            if self.estimated_hours != original.estimated_hours:
                difference = self.estimated_hours - original.estimated_hours
                self.remaining_hours += difference
        
        super().save(*args, **kwargs)

    def start_session(self, user):
        """Start a new session for the task"""
        # Check if there's already an active session
        existing_session = TaskSession.objects.filter(
            task=self, 
            user=user, 
            end_time__isnull=True
        ).first()
        
        if existing_session:
            # Session already exists, return it without creating a new one
            return existing_session
        
        # Create a new session
        return TaskSession.objects.create(task=self, user=user, start_time=timezone.now())

    def stop_session(self, user):
        """Stop the current session and log the time"""
        session = TaskSession.objects.filter(task=self, user=user, end_time__isnull=True).first()
        if session:
            session.end_time = timezone.now()
            session.save()
            # Log the time spent
            hours = session.duration()
            if hours < 0.5:
                TimeLog.log_time(task=self, user=user, hours=0.5, description="Auto-logged from session")
            else:
                TimeLog.log_time(task=self, user=user, hours=hours, description="Auto-logged from session")
            return True
        return False
    
    def delete(self, *args, **kwargs):
        """Soft delete the task by marking it as deleted."""
        self.is_deleted = True
        self.save()


class TimeLog(models.Model):
    """TimeLog model for recording time spent on tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_logs')
    hours_spent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} logged {self.hours_spent} hours on {self.date}"
    
    def save(self, *args, **kwargs):
        # Handle new TimeLog entries
        if not self.pk:
            task = self.task
            if task.remaining_hours is not None:
                task.remaining_hours = F('remaining_hours') - self.hours_spent
                task.save(update_fields=['remaining_hours'])
        
        # Handle updates to existing TimeLog entries
        else:
            original = TimeLog.objects.get(pk=self.pk)
            task = self.task
            if task.remaining_hours is not None:
                # Add back the original hours and subtract the new hours
                task.remaining_hours = F('remaining_hours') + original.hours_spent - self.hours_spent
                task.save(update_fields=['remaining_hours'])

        super().save(*args, **kwargs)
    
    @classmethod
    def log_time(cls, task, user, hours, description=""):
        """Create a TimeLog entry and update the task's remaining hours."""
        time_log = cls.objects.create(
            task=task,
            user=user,
            hours_spent=hours,
            date=timezone.now().date(),
            description=description
        )

        if task.remaining_hours is not None:
            task.remaining_hours = F('remaining_hours') - hours
            task.save(update_fields=['remaining_hours'])

        return time_log


class TaskSession(models.Model):
    """TaskSession model for tracking time spent on tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_sessions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    def duration(self):
        """Calculate the duration of the session in hours"""
        if self.end_time:
            delta = self.end_time - self.start_time
            return delta.total_seconds() / 3600  # Convert seconds to hours
        return 0