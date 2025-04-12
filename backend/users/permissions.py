from rest_framework.permissions import BasePermission
from projects.models import ProjectMember

class IsAdminUserType(BasePermission):
    """
    Allows access only to users with user_type='ADMIN'.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == request.user.UserType.ADMIN

class IsProductOwner(BasePermission):
    """
    Permission to check if user is a Product Owner for a specific project.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # If 'project_id' is in the URL params, check if user is Product Owner for this project
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
            
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.Role.PRODUCT_OWNER
        ).exists()

class IsScrumMaster(BasePermission):
    """
    Permission to check if user is a Scrum Master for a specific project.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # If 'project_id' is in the URL params, check if user is Scrum Master for this project
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
            
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.Role.SCRUM_MASTER
        ).exists()

class IsDeveloper(BasePermission):
    """
    Permission to check if user is a Developer for a specific project.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # If 'project_id' is in the URL params, check if user is Developer for this project
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
            
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.Role.DEVELOPER
        ).exists()

class IsProjectMember(BasePermission):
    """
    Permission to check if user is a member of a specific project (any role).
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # If 'project_id' is in the URL params, check if user is a member of this project
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
            
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user
        ).exists()

class IsProductOwnerOrScrumMaster(BasePermission):
    """
    Permission to check if user is either a Product Owner or Scrum Master for a specific project.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # If 'project_id' is in the URL params, check if user is PO or SM for this project
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
            
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role__in=[ProjectMember.Role.PRODUCT_OWNER, ProjectMember.Role.SCRUM_MASTER]
        ).exists()

class IsScrumMasterOrDeveloper(BasePermission):
    """
    Permission to check if user is either a Scrum Master or Developer for a specific project.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # If 'project_id' is in the URL params, check if user is SM or Developer for this project
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
            
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role__in=[ProjectMember.Role.SCRUM_MASTER, ProjectMember.Role.DEVELOPER]
        ).exists()
