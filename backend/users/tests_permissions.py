from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from projects.models import Project, ProjectMember
from users.permissions import (
    IsAdminUserType,
    IsProductOwner,
    IsScrumMaster,
    IsDeveloper,
    IsProjectMember as IsProjectMemberPermission,
    IsProductOwnerOrScrumMaster,
    IsScrumMasterOrDeveloper
)

User = get_user_model()


class MockView(APIView):
    """Mock view for testing permissions"""
    
    def get(self, request, *args, **kwargs):
        return Response({"status": "success"}, status=status.HTTP_200_OK)


class PermissionsTestCase(TestCase):
    """Test case for permissions"""
    
    def setUp(self):
        """Set up test data"""
        self.factory = APIRequestFactory()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpassword123',
            user_type=User.UserType.ADMIN
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        # Create product owner
        self.product_owner = User.objects.create_user(
            username='productowner',
            email='po@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        # Create scrum master
        self.scrum_master = User.objects.create_user(
            username='scrummaster',
            email='sm@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        # Create developer
        self.developer = User.objects.create_user(
            username='developer',
            email='dev@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        # Create project with required fields
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project for permission tests',
            product_owner=self.product_owner,
            scrum_master=self.scrum_master
        )
        
        # Add users to project with specific roles
        ProjectMember.objects.create(
            project=self.project,
            user=self.product_owner,
            role=ProjectMember.Role.PRODUCT_OWNER
        )
        
        ProjectMember.objects.create(
            project=self.project,
            user=self.scrum_master,
            role=ProjectMember.Role.SCRUM_MASTER
        )
        
        ProjectMember.objects.create(
            project=self.project,
            user=self.developer,
            role=ProjectMember.Role.DEVELOPER
        )
    
    def test_is_admin_user_type_permission(self):
        """Test IsAdminUserType permission class"""
        # Test with admin user
        request = self.factory.get('/admin-only/')
        force_authenticate(request, user=self.admin_user)
        request.user = self.admin_user  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {}
        
        permission = IsAdminUserType()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with regular user
        request = self.factory.get('/admin-only/')
        force_authenticate(request, user=self.regular_user)
        request.user = self.regular_user  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with unauthenticated user
        request = self.factory.get('/admin-only/')
        request.user = AnonymousUser()  # Use AnonymousUser for unauthenticated
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_is_product_owner_permission(self):
        """Test IsProductOwner permission class"""
        # Test with product owner
        request = self.factory.get('/product-owner-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {'project_id': self.project.id}
        
        permission = IsProductOwner()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with scrum master
        request = self.factory.get('/product-owner-only/')
        force_authenticate(request, user=self.scrum_master)
        request.user = self.scrum_master  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with developer
        request = self.factory.get('/product-owner-only/')
        force_authenticate(request, user=self.developer)
        request.user = self.developer  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with user not in project
        request = self.factory.get('/product-owner-only/')
        force_authenticate(request, user=self.regular_user)
        request.user = self.regular_user  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with unauthenticated user
        request = self.factory.get('/product-owner-only/')
        request.user = AnonymousUser()  # Use AnonymousUser for unauthenticated
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with missing project_id
        view.kwargs = {}
        request = self.factory.get('/product-owner-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_is_scrum_master_permission(self):
        """Test IsScrumMaster permission class"""
        # Test with scrum master
        request = self.factory.get('/scrum-master-only/')
        force_authenticate(request, user=self.scrum_master)
        request.user = self.scrum_master  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {'project_id': self.project.id}
        
        permission = IsScrumMaster()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with product owner
        request = self.factory.get('/scrum-master-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with developer
        request = self.factory.get('/scrum-master-only/')
        force_authenticate(request, user=self.developer)
        request.user = self.developer  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_is_developer_permission(self):
        """Test IsDeveloper permission class"""
        # Test with developer
        request = self.factory.get('/developer-only/')
        force_authenticate(request, user=self.developer)
        request.user = self.developer  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {'project_id': self.project.id}
        
        permission = IsDeveloper()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with scrum master
        request = self.factory.get('/developer-only/')
        force_authenticate(request, user=self.scrum_master)
        request.user = self.scrum_master  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
        
        # Test with product owner
        request = self.factory.get('/developer-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_is_project_member_permission(self):
        """Test IsProjectMember permission class"""
        # Test with product owner
        request = self.factory.get('/project-member-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {'project_id': self.project.id}
        
        permission = IsProjectMemberPermission()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with scrum master
        request = self.factory.get('/project-member-only/')
        force_authenticate(request, user=self.scrum_master)
        request.user = self.scrum_master  # Manually set the user attribute
        
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with developer
        request = self.factory.get('/project-member-only/')
        force_authenticate(request, user=self.developer)
        request.user = self.developer  # Manually set the user attribute
        
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with user not in project
        request = self.factory.get('/project-member-only/')
        force_authenticate(request, user=self.regular_user)
        request.user = self.regular_user  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_is_product_owner_or_scrum_master_permission(self):
        """Test IsProductOwnerOrScrumMaster permission class"""
        # Test with product owner
        request = self.factory.get('/po-or-sm-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {'project_id': self.project.id}
        
        permission = IsProductOwnerOrScrumMaster()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with scrum master
        request = self.factory.get('/po-or-sm-only/')
        force_authenticate(request, user=self.scrum_master)
        request.user = self.scrum_master  # Manually set the user attribute
        
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with developer
        request = self.factory.get('/po-or-sm-only/')
        force_authenticate(request, user=self.developer)
        request.user = self.developer  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_is_scrum_master_or_developer_permission(self):
        """Test IsScrumMasterOrDeveloper permission class"""
        # Test with scrum master
        request = self.factory.get('/sm-or-dev-only/')
        force_authenticate(request, user=self.scrum_master)
        request.user = self.scrum_master  # Manually set the user attribute
        
        view = MockView()
        view.kwargs = {'project_id': self.project.id}
        
        permission = IsScrumMasterOrDeveloper()
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with developer
        request = self.factory.get('/sm-or-dev-only/')
        force_authenticate(request, user=self.developer)
        request.user = self.developer  # Manually set the user attribute
        
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with product owner
        request = self.factory.get('/sm-or-dev-only/')
        force_authenticate(request, user=self.product_owner)
        request.user = self.product_owner  # Manually set the user attribute
        
        self.assertFalse(permission.has_permission(request, view)) 