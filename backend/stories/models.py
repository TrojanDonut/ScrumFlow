from django.db import models
from django.conf import settings
from projects.models import Project
from sprints.models import Sprint


class UserStory(models.Model):
    """User story model for representing features from a user's perspective"""
    
    class Priority(models.TextChoices):
        MUST_HAVE = 'MUST_HAVE', 'Must Have'
        SHOULD_HAVE = 'SHOULD_HAVE', 'Should Have'
        COULD_HAVE = 'COULD_HAVE', 'Could Have'
        WONT_HAVE = 'WONT_HAVE', 'Won\'t Have This Time'
    
    class Status(models.TextChoices):
        NOT_STARTED = 'NOT_STARTED', 'Not Started'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DONE = 'DONE', 'Done'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='stories')
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='stories')
    title = models.CharField(max_length=255)
    description = models.TextField()
    acceptance_criteria = models.TextField()
    priority = models.CharField(max_length=100, choices=Priority.choices, default=Priority.SHOULD_HAVE)
    business_value = models.PositiveIntegerField(default=0)
    story_points = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.NOT_STARTED)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_stories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', '-business_value']
        unique_together = ['project', 'title']
        verbose_name_plural = 'User stories'
    
    def __str__(self):
        return f"{self.title} ({self.get_priority_display()})"
    
    @property
    def is_estimated(self):
        """Check if the story has been estimated"""
        return self.story_points is not None
    
    @property
    def is_in_sprint(self):
        """Check if the story is assigned to a sprint"""
        return self.sprint is not None
    
    @property
    def is_completed(self):
        """Check if the story is considered complete"""
        return self.status in [self.Status.DONE, self.Status.ACCEPTED]


class UserStoryComment(models.Model):
    """Comments on user stories"""
    story = models.ForeignKey(UserStory, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.story.title}" 