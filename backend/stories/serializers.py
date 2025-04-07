from rest_framework import serializers
from .models import UserStory


class UserStorySerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = UserStory
        fields = ['id', 'name', 'text', 'priority', 'status', 'story_points',
                  'sprint', 'project', 'acceptance_tests', 'business_value',
                  'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, data):
        """Custom validation for the UserStory model."""
        if data.get('business_value', 0) <= 0:
            raise serializers.ValidationError(
                "Business value must be a positive number."
            )
        return data
    
    def update(self, instance, validated_data):
        """Custom update method to handle specific fields."""
        if 'name' in validated_data and 'sprint' in validated_data:
            if UserStory.objects.filter(
                name=validated_data['name'],
                sprint=validated_data['sprint']
            ).exclude(id=instance.id).exists():  # Exclude the current instance
                raise serializers.ValidationError(
                    "A user story with this name already exists in the sprint."
                )
        return super().update(instance, validated_data)


class UserStoryCommentSerializer(serializers.ModelSerializer):
    """Serializer for the UserStoryComment model."""

    class Meta:
        # model = UserStoryComment
        fields = [
            'id', 'content', 'story', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
