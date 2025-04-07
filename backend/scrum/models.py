from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Sprint(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    velocity = models.IntegerField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class UserStory(models.Model):
    PRIORITY_CHOICES = [
        ('MUST', 'Must Have'),
        ('COULD', 'Could Have'),
        ('SHOULD', 'Should Have'),
        ('WONT', 'Won\'t Have This Time'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='user_stories')
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_stories')
    title = models.CharField(max_length=200)
    description = models.TextField()
    acceptance_criteria = models.TextField()
    priority = models.CharField(max_length=5, choices=PRIORITY_CHOICES)
    business_value = models.IntegerField()
    time_estimate = models.IntegerField(null=True, blank=True)  # in hours
    is_realized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def status(self):
        if self.is_realized:
            return 'realized'
        elif self.sprint and self.sprint.is_active:
            return 'active'
        else:
            return 'unactive' 