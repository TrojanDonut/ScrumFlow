from django.db import models
from django.conf import settings
from sprints.models import Sprint
from projects.models import Project
from django.core.exceptions import ValidationError


class UserStory(models.Model):
    """User story model for representing features from a user's perspective"""

    class Priority(models.TextChoices):
        MUST_HAVE = 'MUST_HAVE'
        SHOULD_HAVE = 'SHOULD_HAVE'
        COULD_HAVE = 'COULD_HAVE'
        WONT_HAVE = 'WONT_HAVE'

    class Status(models.TextChoices):
        NOT_STARTED = 'NOT_STARTED', 'Not Started'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        DONE = 'DONE', 'Done'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='stories', null=True, blank=True)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='user_stories', null=True, blank=True)
    name = models.CharField(max_length=255)
    text = models.TextField()
    acceptance_tests = models.TextField()
    priority = models.CharField(max_length=50, choices=Priority.choices, default=Priority.MUST_HAVE)

    business_value = models.PositiveIntegerField()
    story_points = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.NOT_STARTED)

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='assigned_user',
        blank=True,
        null=True,
        on_delete=models.SET_NULL)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_stories',
        null=True,  # Allow null temporarily
        blank=True  # Allow blank temporarily
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', '-business_value']
        unique_together = [['sprint', 'name'], ['project', 'name']]
        verbose_name_plural = 'User stories'

    def __str__(self):
        return self.name

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
    
    def clean(self):
        """Custom validation to ensure that a user story is not assigned to multiple sprints"""
        if UserStory.objects.exclude(pk=self.pk).filter(
            name__iexact=self.name,
            project=self.project,
            ).exists():
            raise ValidationError({'name': 'Name must be unique (case-insensitive).'})
    
    def save(self, *args, **kwargs):
        """Override save method to enforce unique constraint on name"""
        self.full_clean()
        super().save(*args, **kwargs)


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
        return f"Comment by {self.author.username} on {self.story.name}"
