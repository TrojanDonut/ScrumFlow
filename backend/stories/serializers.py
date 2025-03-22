from rest_framework import serializers
from .models import UserStory

class UserStorySerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = UserStory
        fields = ['id', 'name', 'text', 'priority', 'status', 'story_points',
                 'project', 'sprint', 'acceptance_tests', 'business_value', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Custom validation for the UserStory model."""
        if 'name' in data and 'sprint' in data:
            if UserStory.objects.filter(name=data['name'], sprint=data['sprint']).exists():
                raise serializers.ValidationError("A user story with this name already exists in the sprint.")
        if data.get('priority') not in ['must have', 'should have', 'could have', "won't have this time"]:
            raise serializers.ValidationError("Invalid priority value.")
        if data.get('business_value', 0) <= 0:
            raise serializers.ValidationError("Business value must be a positive number.")
        return data


class UserStoryCommentSerializer(serializers.ModelSerializer):
    """Serializer for the UserStoryComment model."""
    
    class Meta:
        # model = UserStoryComment
        fields = ['id', 'content', 'story', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']