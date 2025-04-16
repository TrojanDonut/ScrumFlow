from rest_framework import generics
from .models import Project, ProjectMember, ProjectWallPost, ProjectWallComment, ProjectDocument
from .serializers import (
    ProjectSerializer, ProjectMemberSerializer, ProjectWallPostSerializer,
    ProjectWallCommentSerializer, ProjectDocumentSerializer
)
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsProjectMember, IsScrumMaster

class ProjectListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all the existing projects.

    post:
    Create a new project instance.
    """
    serializer_class = ProjectSerializer

    def get_queryset(self):
        # Admin users can see all projects
        if self.request.user.is_superuser or getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'user_type', '') == 'ADMIN':
            return Project.objects.all()
        
        # Regular users can only see projects they're members of
        return Project.objects.filter(
            members__user=self.request.user
        ).distinct()

    def perform_create(self, serializer):
        product_owner = self.request.data.get('product_owner')
        scrum_master = self.request.data.get('scrum_master')

        if not product_owner or not scrum_master:
            raise ValidationError("Both Product Owner and Scrum Master must be provided.")

        if product_owner == scrum_master:
            raise ValidationError("Product Owner and Scrum Master cannot be the same user.")

        # Save the project first
        project = serializer.save()
        
        # Now create ProjectMember entries for product_owner and scrum_master
        from .models import ProjectMember
        
        # Add product owner as a member with PRODUCT_OWNER role
        ProjectMember.objects.create(
            project=project,
            user_id=product_owner,
            role=ProjectMember.Role.PRODUCT_OWNER
        )
        
        # Add scrum master as a member with SCRUM_MASTER role
        ProjectMember.objects.create(
            project=project,
            user_id=scrum_master,
            role=ProjectMember.Role.SCRUM_MASTER
        )

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific project.

    put:
    Update the details of a specific project.

    patch:
    Partially update the details of a specific project.

    delete:
    Delete a specific project.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_members'] = True
        return context
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_product_owner = instance.product_owner_id
        old_scrum_master = instance.scrum_master_id
        
        # Check if product_owner or scrum_master are being updated
        new_product_owner = request.data.get('product_owner')
        new_scrum_master = request.data.get('scrum_master')
        
        # Perform the normal update
        response = super().update(request, *args, **kwargs)
        
        # If product_owner changed, update the ProjectMember entry
        if new_product_owner and int(new_product_owner) != old_product_owner:
            from .models import ProjectMember
            
            # Remove old product owner role if exists
            ProjectMember.objects.filter(
                project=instance,
                role=ProjectMember.Role.PRODUCT_OWNER
            ).delete()
            
            # Add new product owner as member with PRODUCT_OWNER role
            ProjectMember.objects.create(
                project=instance,
                user_id=new_product_owner,
                role=ProjectMember.Role.PRODUCT_OWNER
            )
        
        # If scrum_master changed, update the ProjectMember entry
        if new_scrum_master and int(new_scrum_master) != old_scrum_master:
            from .models import ProjectMember
            
            # Remove old scrum master role if exists
            ProjectMember.objects.filter(
                project=instance,
                role=ProjectMember.Role.SCRUM_MASTER
            ).delete()
            
            # Add new scrum master as member with SCRUM_MASTER role
            ProjectMember.objects.create(
                project=instance,
                user_id=new_scrum_master,
                role=ProjectMember.Role.SCRUM_MASTER
            )
            
        return response


class ProjectMemberListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all members of a specific project.

    post:
    Add a new member to a specific project.
    """
    serializer_class = ProjectMemberSerializer

    def get_queryset(self):
        return ProjectMember.objects.filter(project_id=self.kwargs['project_id'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_id'])

class ProjectMemberListView(generics.ListAPIView):
    """
    get:
    Return a list of all project members.
    """
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer

class ProjectMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific project member.

    put:
    Update the details of a specific project member.

    patch:
    Partially update the details of a specific project member.

    delete:
    Remove a specific project member.
    """
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer

class ProjectWallPostListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all wall posts for a specific project.

    post:
    Create a new wall post for a specific project.
    """
    serializer_class = ProjectWallPostSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - All project members can view and create wall posts
        """
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        return ProjectWallPost.objects.filter(project_id=self.kwargs['project_id'])

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs['project_id'], 
            author=self.request.user
        )


class ProjectWallPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific wall post.

    delete:
    Delete a specific wall post and all its comments.
    """
    serializer_class = ProjectWallPostSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - Retrieve: Any authenticated project member can view wall post details
        - Delete: Only Scrum Master can delete wall posts
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsScrumMaster()]

    def get_queryset(self):
        return ProjectWallPost.objects.filter(
            project_id=self.kwargs['project_id']
        )


class ProjectWallCommentListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all comments for a specific wall post.

    post:
    Create a new comment for a specific wall post.
    """
    serializer_class = ProjectWallCommentSerializer
    
    def get_permissions(self):
        """
        Any authenticated project member can view and create comments
        """
        return [IsAuthenticated(), IsProjectMember()]

    def get_queryset(self):
        return ProjectWallComment.objects.filter(post_id=self.kwargs['post_id'])

    def perform_create(self, serializer):
        serializer.save(
            post_id=self.kwargs['post_id'],
            author=self.request.user
        )


class ProjectWallCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific comment.

    delete:
    Delete a specific comment.
    """
    serializer_class = ProjectWallCommentSerializer
    
    def get_permissions(self):
        """
        Get permissions based on the request method:
        - Retrieve: Any authenticated project member can view comment details
        - Delete: Only Scrum Master can delete comments
        """
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsScrumMaster()]

    def get_queryset(self):
        return ProjectWallComment.objects.filter(
            post__project_id=self.kwargs['project_id']
        )

class ProjectDocumentListCreateView(generics.ListCreateAPIView):
    """
    get:
    Return a list of all documents for a specific project.

    post:
    Create a new document for a specific project.
    """
    serializer_class = ProjectDocumentSerializer

    def get_queryset(self):
        return ProjectDocument.objects.filter(project_id=self.kwargs['project_id'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['project_id'])

class ProjectDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    get:
    Return the details of a specific project document.

    put:
    Update the details of a specific project document.

    patch:
    Partially update the details of a specific project document.

    delete:
    Delete a specific project document.
    """
    queryset = ProjectDocument.objects.all()
    serializer_class = ProjectDocumentSerializer
