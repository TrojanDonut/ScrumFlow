from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from projects.models import Project


class Sprint(models.Model):
    """Sprint model for managing time-boxed development periods"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    start_date = models.DateField()
    end_date = models.DateField()
    velocity = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        unique_together = [['project', 'start_date'], ['project', 'end_date']]
    
    def __str__(self):
        return f"Sprint in {self.project.name} ({self.start_date} to {self.end_date})"
    
    def clean(self):
        """Validate sprint dates and check for overlaps"""
        if self.start_date and self.end_date:
            # Check that end date is after start date
            if self.end_date < self.start_date:
                raise ValidationError("End date must be after start date")
            
            # Check for overlapping sprints in the same project
            overlapping_sprints = Sprint.objects.filter(
                project=self.project,
                start_date__lte=self.end_date,
                end_date__gte=self.start_date
            )
            
            # Exclude self when checking for overlaps during updates
            if self.pk:
                overlapping_sprints = overlapping_sprints.exclude(pk=self.pk)
            
            if overlapping_sprints.exists():
                raise ValidationError("Sprint dates overlap with an existing sprint")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        """Check if the sprint is currently active"""
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date
    
    @property
    def is_future(self):
        """Check if the sprint is in the future"""
        today = timezone.now().date()
        return self.start_date > today
    
    @property
    def is_past(self):
        """Check if the sprint is in the past"""
        today = timezone.now().date()
        return self.end_date < today 