from rest_framework import serializers
from .models import Sprint
from django.utils import timezone
from datetime import datetime


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = [
            'id', 'project', 'start_date', 'end_date', 'velocity',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, data):
        """Custom validation for sprint dates and velocity"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        velocity = data.get('velocity', 0)

        # Check that end date is not before start date
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                "The end date cannot be before the start date. "
                "Please select a valid date range."
            )

        # Check that start date is not in the past (only for new sprints)
        if self.instance is None and start_date and start_date < timezone.now().date():
            raise serializers.ValidationError(
                "The start date cannot be in the past. "
                "Please select a future date."
            )

        # Check that velocity is positive
        if velocity <= 0:
            raise serializers.ValidationError("Velocity must be greater than 0.")

        # Check that velocity is under 100
        if velocity > 100:
            raise serializers.ValidationError("Velocity must be less than or equal to 100.")

        # Check if start_date or end_date falls on a weekend
        if start_date and start_date.weekday() in (5, 6):  # 5 = Saturday, 6 = Sunday
            raise serializers.ValidationError("Start date cannot be on a weekend.")
        if end_date and end_date.weekday() in (5, 6):  # 5 = Saturday, 6 = Sunday
            raise serializers.ValidationError("End date cannot be on a weekend.")

        return data
