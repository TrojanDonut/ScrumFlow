from rest_framework import serializers
# from .models import UserStory, UserStoryComment

class UserStorySerializer(serializers.ModelSerializer):
    """Serializer for the UserStory model."""
    
    class Meta:
        # model = UserStory
        fields = ['id', 'title', 'description', 'priority', 'status', 'story_points',
                 'project', 'sprint', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Custom validation for the UserStory model."""
        # Validation logic here
        return data


class UserStoryCommentSerializer(serializers.ModelSerializer):
    """Serializer for the UserStoryComment model."""
    
    class Meta:
        # model = UserStoryComment
        fields = ['id', 'content', 'story', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at'] 