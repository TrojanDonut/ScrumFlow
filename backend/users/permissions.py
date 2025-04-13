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

class IsScrumMasterFromSprint(BasePermission):
    """
    Permission to check if user is a Scrum Master for a project based on a sprint ID.
    For endpoints that don't have a direct project_id in the URL.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check for sprint_id
        sprint_id = view.kwargs.get('sprint_id')
        if sprint_id:
            from sprints.models import Sprint
            try:
                sprint = Sprint.objects.get(id=sprint_id)
                project_id = sprint.project_id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user,
                    role=ProjectMember.Role.SCRUM_MASTER
                ).exists()
            except Sprint.DoesNotExist:
                return False
                
        # Check for story_id and possibly sprint_id
        story_id = view.kwargs.get('story_id')
        if story_id:
            from stories.models import UserStory
            try:
                story = UserStory.objects.get(id=story_id)
                # Get project either directly from story or from its sprint
                if story.project:
                    project_id = story.project_id
                elif story.sprint:
                    project_id = story.sprint.project_id
                else:
                    return False
                
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user,
                    role=ProjectMember.Role.SCRUM_MASTER
                ).exists()
            except UserStory.DoesNotExist:
                return False
                
        return False


class IsProjectMemberFromSprint(BasePermission):
    """
    Permission to check if user is a member of a project based on a sprint ID.
    For endpoints that don't have a direct project_id in the URL.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check for sprint_id
        sprint_id = view.kwargs.get('sprint_id')
        if sprint_id:
            from sprints.models import Sprint
            try:
                sprint = Sprint.objects.get(id=sprint_id)
                project_id = sprint.project_id
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user
                ).exists()
            except Sprint.DoesNotExist:
                return False
                
        # Check for story_id and possibly sprint_id
        story_id = view.kwargs.get('story_id')
        if story_id:
            from stories.models import UserStory
            try:
                story = UserStory.objects.get(id=story_id)
                # Get project either directly from story or from its sprint
                if story.project:
                    project_id = story.project_id
                elif story.sprint:
                    project_id = story.sprint.project_id
                else:
                    return False
                
                return ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user
                ).exists()
            except UserStory.DoesNotExist:
                return False
                
        return False
