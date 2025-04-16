from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from projects.models import Project, ProjectMember
from sprints.models import Sprint
from stories.models import UserStory
from datetime import date, timedelta

User = get_user_model()


class SprintPermissionsTestCase(TestCase):
    """Test case for Sprint view permissions"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpassword123',
            user_type=User.UserType.ADMIN
        )
        
        self.product_owner = User.objects.create_user(
            username='productowner',
            email='po@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        self.scrum_master = User.objects.create_user(
            username='scrummaster',
            email='sm@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        self.developer = User.objects.create_user(
            username='developer',
            email='dev@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        self.non_member = User.objects.create_user(
            username='nonmember',
            email='nonmember@example.com',
            password='testpassword123',
            user_type=User.UserType.USER
        )
        
        # Create a project
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project for API tests',
            product_owner=self.product_owner,
            scrum_master=self.scrum_master
        )
        
        # Add users as project members with roles
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
        
        # Create a sprint
        today = date.today()
        self.sprint = Sprint.objects.create(
            project=self.project,
            start_date=today,
            end_date=today + timedelta(days=14),
            velocity=20,
            created_by=self.scrum_master
        )
        
        # Create a future sprint
        self.future_sprint = Sprint.objects.create(
            project=self.project,
            start_date=today + timedelta(days=15),
            end_date=today + timedelta(days=29),
            velocity=20,
            created_by=self.scrum_master
        )
        
        # Create a user story in the sprint
        self.user_story = UserStory.objects.create(
            name='Test Story',
            text='As a user, I want to test sprint permissions.',
            acceptance_tests='Verify sprint permissions work correctly.',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            project=self.project,
            sprint=self.sprint,
            created_by=self.product_owner,
            story_points=5
        )
        
        # URLs for testing
        self.sprints_list_url = reverse('sprints:sprint-list-create', kwargs={'project_id': self.project.id})
        self.sprint_detail_url = reverse('sprints:sprint-detail', kwargs={'project_id': self.project.id, 'pk': self.sprint.id})
        self.future_sprint_detail_url = reverse('sprints:sprint-detail', kwargs={'project_id': self.project.id, 'pk': self.future_sprint.id})
        self.active_sprint_url = reverse('sprints:active-sprint', kwargs={'project_id': self.project.id})
        self.finish_sprint_url = reverse('sprints:finish-sprint', kwargs={'project_id': self.project.id, 'pk': self.sprint.id})
    
    def test_sprint_list_view_permissions(self):
        """Test that any project member can view the sprints list"""
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.get(self.sprints_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.get(self.sprints_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.get(self.sprints_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with non-member (should fail)
        self.client.force_authenticate(user=self.non_member)
        response = self.client.get(self.sprints_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.get(self.sprints_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_sprint_create_permissions(self):
        """Test that only Scrum Master can create sprints"""
        # Use dates far in the future to avoid overlap with existing sprints
        future_date = date.today() + timedelta(days=90)  # 90 days in the future
        
        # Ensure both dates don't fall on weekend
        while future_date.weekday() in (5, 6):  # Skip weekend days
            future_date = future_date + timedelta(days=1)
            
        future_end_date = future_date + timedelta(days=14)
        while future_end_date.weekday() in (5, 6):  # Skip weekend days
            future_end_date = future_end_date + timedelta(days=1)
            
        sprint_data = {
            'start_date': future_date.isoformat(),
            'end_date': future_end_date.isoformat(),
            'velocity': 15,
            'project': self.project.id
        }
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.sprints_list_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.sprints_list_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with non-member (should fail)
        self.client.force_authenticate(user=self.non_member)
        response = self.client.post(self.sprints_list_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.sprints_list_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_sprint_update_permissions(self):
        """Test that only Scrum Master can update sprints"""
        sprint_data = {
            'velocity': 25
        }
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.patch(self.future_sprint_detail_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.patch(self.future_sprint_detail_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.patch(self.future_sprint_detail_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test update to active sprint dates (should fail)
        sprint_data = {
            'start_date': (date.today() - timedelta(days=1)).isoformat()
        }
        response = self.client.patch(self.sprint_detail_url, sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_sprint_delete_permissions(self):
        """Test that only Scrum Master can delete sprints"""
        # Create a test sprint to delete
        future_date = date.today() + timedelta(days=30)
        delete_sprint = Sprint.objects.create(
            project=self.project,
            start_date=future_date,
            end_date=future_date + timedelta(days=14),
            velocity=20,
            created_by=self.scrum_master
        )
        
        delete_url = reverse('sprints:sprint-detail', kwargs={'project_id': self.project.id, 'pk': delete_sprint.id})
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_active_sprint_view_permissions(self):
        """Test that any project member can view the active sprint"""
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.get(self.active_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.get(self.active_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.get(self.active_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with non-member (should fail)
        self.client.force_authenticate(user=self.non_member)
        response = self.client.get(self.active_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_finish_sprint_permissions(self):
        """Test that only Scrum Master can finish a sprint"""
        # Update story to be completed
        self.user_story.status = UserStory.Status.ACCEPTED
        self.user_story.save()
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.finish_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.finish_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.finish_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify sprint is completed
        self.sprint.refresh_from_db()
        self.assertTrue(self.sprint.is_completed)
        
        # Create new sprint with incomplete story - use dates after our existing sprints
        # Find a date that doesn't overlap with any existing sprints
        future_date = date.today() + timedelta(days=60)  # 60 days in the future
        
        # Ensure both dates don't fall on weekend
        while future_date.weekday() in (5, 6):  # Skip weekend days
            future_date = future_date + timedelta(days=1)
            
        future_end_date = future_date + timedelta(days=14)
        while future_end_date.weekday() in (5, 6):  # Skip weekend days
            future_end_date = future_end_date + timedelta(days=1)
            
        new_sprint = Sprint.objects.create(
            project=self.project,
            start_date=future_date,
            end_date=future_end_date,
            velocity=20,
            created_by=self.scrum_master
        )
        
        incomplete_story = UserStory.objects.create(
            name='Incomplete Story',
            text='This story is not completed.',
            acceptance_tests='Not verified yet.',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            project=self.project,
            sprint=new_sprint,
            created_by=self.product_owner,
            story_points=5,
            status=UserStory.Status.IN_PROGRESS
        )
        
        incomplete_sprint_url = reverse('sprints:finish-sprint', kwargs={'project_id': self.project.id, 'pk': new_sprint.id})
        
        # Test finish sprint with incomplete stories (should fail)
        response = self.client.post(incomplete_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 