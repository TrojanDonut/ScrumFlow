from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Sprint
from .serializers import SprintSerializer
from projects.models import Project
from django.core.exceptions import ValidationError as DjangoValidationError
import logging

logger = logging.getLogger(__name__)

class SprintListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating sprints."""
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return sprints for a specific project."""
        project_id = self.kwargs['project_id']
        return Sprint.objects.filter(
            project_id=project_id
        ).order_by('-start_date')

    def create(self, request, *args, **kwargs):
        """Custom create method to validate and save a new sprint."""
        project_id = self.kwargs['project_id']
        logger.debug(
            f"Creating sprint for project_id: {project_id} "
            f"by user: {request.user}"
        )

        if not request.user.is_authenticated:
            logger.error("User is not authenticated")
            return Response(
                {"error": "User is not authenticated"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            logger.error(f"Project with id {project_id} does not exist")
            return Response(
                {"error": "Project not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Add the project and created_by user to the request data
        data = request.data.copy()
        data['project'] = project.id
        data['created_by'] = request.user.id

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            try:
                serializer.save()
                logger.debug("Sprint created successfully")
                return Response(
                    serializer.data, 
                    status=status.HTTP_201_CREATED
                )
            except DjangoValidationError as e:
                logger.error(f"Django validation error: {e}")
                return Response(
                    {"error": str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        logger.error(f"Error creating sprint: {serializer.errors}")
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )

class SprintDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API view for retrieving, updating, and deleting a sprint."""
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """Custom update method to validate and update a sprint."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial
        )
        
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except DjangoValidationError as e:
                logger.error(f"Django validation error: {e}")
                return Response(
                    {"error": str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


