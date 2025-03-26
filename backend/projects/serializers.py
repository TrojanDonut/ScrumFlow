from rest_framework import serializers
from .models import Project, ProjectMember, ProjectWallPost, ProjectWallComment, ProjectDocument
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user'] = UserSerializer(instance.user).data
        return representation

class ProjectSerializer(serializers.ModelSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'product_owner', 'scrum_master', 'created_at', 'updated_at', 'members']

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
