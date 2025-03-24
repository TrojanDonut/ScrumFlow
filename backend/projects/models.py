from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Project(models.Model):
    """Project model to represent a Scrum project"""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Model to represent the relationship between a user and a project"""

    class Role(models.TextChoices):
        PRODUCT_OWNER = 'PRODUCT_OWNER', 'Product Owner'
        SCRUM_MASTER = 'SCRUM_MASTER', 'Scrum Master'
        DEVELOPER = 'DEVELOPER', 'Developer'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    role = models.CharField(max_length=20, choices=Role.choices)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')
    
    def save(self, *args, **kwargs):
        # Check if the role is Scrum Master or Product Owner
        if self.role in [self.Role.SCRUM_MASTER, self.Role.PRODUCT_OWNER]:
            # Check if another member with the same role exists in the project
            if ProjectMember.objects.filter(
                project=self.project,
                role=self.role
            ).exclude(id=self.id).exists():
                raise ValidationError(f"Only one {self.get_role_display()} is allowed per project.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} as {self.get_role_display()} in {self.project.name}"


class ProjectWallPost(models.Model):
    """Model for posts on the project wall"""
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} in {self.project.name}"


class ProjectWallComment(models.Model):
    """Model for comments on posts in the project wall"""
    post = models.ForeignKey(
        ProjectWallPost,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on post {self.post.id}"


class ProjectDocument(models.Model):
    """Model for project documentation"""
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} - {self.project.name}"
