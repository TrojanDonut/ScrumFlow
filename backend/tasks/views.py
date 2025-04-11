from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from tasks.models import Task, TimeLog
from tasks.serializers import TaskSerializer, TimeLogSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all tasks for a specific user story.

    post:
    Create a new task for a specific user story.
    """
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(story_id=self.kwargs['story_id'])

    def perform_create(self, serializer):
        serializer.save(story_id=self.kwargs['story_id'])


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific task.

    put:
    Update the details of a specific task.

    patch:
    Partially update the details of a specific task.

    delete:
    Delete a specific task.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class ProjectTasksView(generics.ListAPIView):
    """
    get:
    Return a list of all tasks for all user stories belonging to a specific project.
    """
    serializer_class = TaskSerializer

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Task.objects.filter(
            story__project_id=project_id
        ) | Task.objects.filter(
            story__project_id__isnull=True,
            story__sprint__project_id=project_id
        )


class TaskAcceptView(APIView):
    """
    post:
    The specific task is accepted - assigned to user.
    """
    def post(self, request, pk):
        task = Task.objects.get(pk=pk)
        task.status = 'ASSIGNED'
        task.save()
        return Response({'status': 'Task assigned'}, status=status.HTTP_200_OK)


class TaskRejectView(APIView):
    """
    post:
    The specific task is rejected - unassigned to user.
    """
    def post(self, request, pk):
        task = Task.objects.get(pk=pk)
        task.status = 'UNASSIGNED'
        task.assigned_to = None
        task.save()
        return Response({'status': 'Task unassigned'}, status=status.HTTP_200_OK)


class TaskCompleteView(APIView):
    """
    post:
    Complete a specific task.
    """
    def post(self, request, pk):
        task = Task.objects.get(pk=pk)
        task.status = 'COMPLETED'
        task.save()
        return Response({'status': 'Task completed'}, status=status.HTTP_200_OK)

# TODO: not yet tested
# class TimeLogListCreateView(generics.ListCreateAPIView):
#     """
#     get:
#     Return a list of all time logs for a specific task.

#     post:
#     Create a new time log for a specific task.
#     """
#     serializer_class = TimeLogSerializer

#     def get_queryset(self):
#         return TimeLog.objects.filter(task_id=self.kwargs['pk'])

#     def perform_create(self, serializer):
#         serializer.save(task_id=self.kwargs['pk'])


# class TimeLogDetailView(generics.RetrieveUpdateDestroyAPIView):
#     """
#     get:
#     Return the details of a specific time log.

#     put:
#     Update the details of a specific time log.

#     patch:
#     Partially update the details of a specific time log.

#     delete:
#     Delete a specific time log.
#     """
#     queryset = TimeLog.objects.all()
#     serializer_class = TimeLogSerializer


# class UserTasksView(generics.ListAPIView):
#     """
#     get:
#     Return a list of all tasks assigned to the current user.
#     """
#     serializer_class = TaskSerializer

#     def get_queryset(self):
#         return Task.objects.filter(assigned_to=self.request.user)


# class UserTimeLogsView(generics.ListAPIView):
#     """
#     get:
#     Return a list of all time logs created by the current user.
#     """
#     serializer_class = TimeLogSerializer

#     def get_queryset(self):
#         return TimeLog.objects.filter(user=self.request.user)
