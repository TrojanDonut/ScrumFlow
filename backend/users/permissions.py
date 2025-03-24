from rest_framework.permissions import BasePermission

class IsAdminUserType(BasePermission):
    """
    Allows access only to users with user_type='ADMIN'.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == request.user.UserType.ADMIN
