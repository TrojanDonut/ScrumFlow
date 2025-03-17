from rest_framework import serializers
from tasks.models import Task, TimeLog
from django.contrib.auth import get_user_model

User = get_user_model()

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class TimeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeLog
        fields = '__all__'
