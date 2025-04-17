from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from projects.models import Project


class Sprint(models.Model):
    """Sprint model for managing time-boxed development periods"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    velocity = models.IntegerField()
    is_completed = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = [['project', 'start_date'], ['project', 'end_date']]

    def __str__(self):
        return f"Sprint {self.id} for project {self.project.name}"

    def clean(self):
        """Validate sprint dates and check for overlaps"""
        if self.start_date and self.end_date:
            # Check that end date is after start date
            if self.end_date < self.start_date:
                raise ValidationError(
                    "The end date cannot be before the start date. "
                    "Please select a valid date range."
                )

            # Check that start date is not in the past (only for new sprints)
            if not self.pk and self.start_date < timezone.now().date():
                raise ValidationError(
                    "The start date cannot be in the past. "
                    "Please select a future date."
                )

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
                raise ValidationError(
                    "The sprint dates overlap with an existing sprint. "
                    "Please choose different dates."
                )

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
