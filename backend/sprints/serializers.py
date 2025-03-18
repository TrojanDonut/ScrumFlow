from rest_framework import serializers
from .models import Sprint
from django.utils import timezone


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

        # Check that start date is not in the past
        if start_date and start_date < timezone.now().date():
            raise serializers.ValidationError(
                "The start date cannot be in the past. "
                "Please select a future date."
            )

        # Check that velocity is positive
        if velocity < 0:
            raise serializers.ValidationError(
                "Velocity must be a positive number. "
                "Please enter a valid velocity."
            )

        return data
