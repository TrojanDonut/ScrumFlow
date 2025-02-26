from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserDetailSerializer

User = get_user_model()


class UserListCreateView(generics.ListCreateAPIView):
    """
    List all users or create a new user
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Only system administrators can list or create users
        """
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user instance.
    """
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    
    def get_permissions(self):
        """
        Users can view and update their own information.
        System administrators can view and update any user information.
        """
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class CurrentUserView(APIView):
    """
    Get the current authenticated user
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data) 