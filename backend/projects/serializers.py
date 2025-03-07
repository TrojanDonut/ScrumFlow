from rest_framework import serializers
from .models import Project, ProjectMember, ProjectWallPost, ProjectWallComment, ProjectDocument

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at']

class ProjectSerializer(serializers.ModelSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'members']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not self.context.get('include_members', False):
            representation.pop('members', None)
        return representation

class ProjectWallPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectWallPost
        fields = '__all__'

class ProjectWallCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectWallComment
        fields = '__all__'

class ProjectDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDocument
        fields = '__all__'