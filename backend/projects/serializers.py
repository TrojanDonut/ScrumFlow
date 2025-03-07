from rest_framework import serializers
from .models import Project, ProjectMember, ProjectWallPost, ProjectWallComment, ProjectDocument

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMember
        fields = '__all__'

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