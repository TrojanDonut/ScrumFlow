from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Sprint(models.Model):
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='sprints'
    )
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

    STATE_CHOICES = [
        ('BACKLOG', 'Backlog'),
        ('SPRINT', 'In Sprint'),
        ('IN_PROGRESS', 'In Progress'),
        ('REVIEW', 'In Review'),
        ('DONE', 'Done'),
        ('REALIZED', 'Realized'),
    ]

    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='user_stories'
    )
    sprint = models.ForeignKey(
        Sprint, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='user_stories'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    acceptance_criteria = models.TextField()
    priority = models.CharField(max_length=5, choices=PRIORITY_CHOICES)
    business_value = models.IntegerField()
    time_estimate = models.IntegerField(null=True, blank=True)  # in hours
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='BACKLOG')
    is_realized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def move_to_sprint(self, sprint):
        """Move story to a sprint"""
        if self.state != 'BACKLOG':
            raise ValueError("Only stories in backlog can be moved to sprint")
        if not sprint.is_active:
            raise ValueError("Can only move stories to active sprints")
        self.sprint = sprint
        self.state = 'SPRINT'
        self.save()

    def start_work(self):
        """Start working on the story"""
        if self.state != 'SPRINT':
            raise ValueError("Can only start work on stories in sprint")
        self.state = 'IN_PROGRESS'
        self.save()

    def move_to_review(self):
        """Move story to review state"""
        if self.state != 'IN_PROGRESS':
            raise ValueError("Can only move to review stories that are in progress")
        self.state = 'REVIEW'
        self.save()

    def mark_as_done(self):
        """Mark story as done"""
        if self.state != 'REVIEW':
            raise ValueError("Can only mark as done stories that are in review")
        self.state = 'DONE'
        self.save()

    def mark_as_realized(self):
        """Mark story as realized"""
        if self.state != 'DONE':
            raise ValueError("Can only mark as realized stories that are done")
        self.state = 'REALIZED'
        self.is_realized = True
        self.save()

    @property
    def status(self):
        return self.state 