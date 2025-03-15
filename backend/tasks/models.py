from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from stories.models import UserStory


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
    estimated_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0.00)],
        null=True,
        blank=True
    )
    remaining_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
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
    
    def __str__(self):
        return f"{self.description[:50]}... ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # Set remaining hours to estimated hours on creation
        if not self.pk and self.remaining_hours is None:
            self.remaining_hours = self.estimated_hours
        super().save(*args, **kwargs)


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