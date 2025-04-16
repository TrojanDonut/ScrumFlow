from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from projects.models import Project, ProjectMember
from sprints.models import Sprint
from stories.models import UserStory
import json
from datetime import date, timedelta

User = get_user_model()


class UserStoryPermissionsTestCase(TestCase):
    """Test case for User Story view permissions"""
    
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
        
        # Create a user story
        self.user_story = UserStory.objects.create(
            name='Test Story',
            text='As a user, I want to test permissions.',
            acceptance_tests='Verify permissions work correctly.',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            project=self.project,
            created_by=self.product_owner
        )
        
        # Create a story assigned to sprint
        self.sprint_story = UserStory.objects.create(
            name='Sprint Story',
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
        self.stories_list_url = reverse('user-stories-list-create')
        self.story_detail_url = reverse('user-story-detail', kwargs={'pk': self.user_story.id})
        self.story_points_url = reverse('user-story-update-points', kwargs={'story_id': self.user_story.id})
        self.story_status_url = reverse('user-story-update-status', kwargs={'story_id': self.user_story.id})
        self.remove_from_sprint_url = reverse('remove-story-from-sprint', kwargs={'story_id': self.sprint_story.id})
        self.sprint_stories_url = reverse('sprint-stories', kwargs={'sprint_id': self.sprint.id})
    
    def test_story_list_view_permissions(self):
        """Test that any project member can view the stories list"""
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.get(self.stories_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.get(self.stories_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.get(self.stories_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with non-member
        self.client.force_authenticate(user=self.non_member)
        response = self.client.get(self.stories_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # This should be accessible, might contain empty data
        
        # Test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.get(self.stories_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_story_create_permissions(self):
        """Test that only Product Owner and Scrum Master can create stories"""
        story_data = {
            'name': 'New Test Story',
            'text': 'As a user, I want to create a new story.',
            'acceptance_tests': 'Verify story creation works correctly.',
            'priority': UserStory.Priority.MUST_HAVE,
            'business_value': 100,
            'project': self.project.id,
            'sprint': None
        }
        
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.stories_list_url, story_data, format='json')
        print("Product Owner create response:", response.status_code, response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        story_data['name'] = 'Another Test Story'
        response = self.client.post(self.stories_list_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        story_data['name'] = 'Developer Test Story'
        response = self.client.post(self.stories_list_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with non-member (should fail)
        self.client.force_authenticate(user=self.non_member)
        response = self.client.post(self.stories_list_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_story_update_permissions(self):
        """Test that only Product Owner and Scrum Master can update stories"""
        story_data = {
            'name': 'Updated Story Name',
            'business_value': 150
        }
        
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.patch(self.story_detail_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        story_data['name'] = 'Another Update'
        response = self.client.patch(self.story_detail_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        story_data['name'] = 'Developer Update'
        response = self.client.patch(self.story_detail_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with non-member (should fail)
        self.client.force_authenticate(user=self.non_member)
        response = self.client.patch(self.story_detail_url, story_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_story_delete_permissions(self):
        """Test that only Product Owner and Scrum Master can delete stories"""
        # Create a test story to delete
        delete_story = UserStory.objects.create(
            name='Delete Story',
            text='As a user, I want to test delete permissions.',
            acceptance_tests='Verify delete permissions work correctly.',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            project=self.project,
            created_by=self.product_owner
        )
        
        delete_url = reverse('user-story-detail', kwargs={'pk': delete_story.id})
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Soft delete returns 200
        
        # Create another story to delete
        delete_story = UserStory.objects.create(
            name='Delete Story 2',
            text='As a user, I want to test delete permissions again.',
            acceptance_tests='Verify delete permissions work correctly again.',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            project=self.project,
            created_by=self.product_owner
        )
        
        delete_url = reverse('user-story-detail', kwargs={'pk': delete_story.id})
        
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)  # Soft delete returns 200
    
    def test_update_story_points_permissions(self):
        """Test that only Scrum Master can update story points"""
        points_data = {'story_points': 8}
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.story_points_url, points_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.story_points_url, points_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.story_points_url, points_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_story_status_permissions(self):
        """Test that only Product Owner can accept/reject stories"""
        # First update story points so it can be added to a sprint
        self.client.force_authenticate(user=self.scrum_master)
        self.client.post(self.story_points_url, {'story_points': 8}, format='json')
        
        # Add story to sprint
        self.user_story.sprint = self.sprint
        self.user_story.save()
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(
            self.story_status_url,
            {'status': UserStory.Status.ACCEPTED},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master (should fail)
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(
            self.story_status_url,
            {'status': UserStory.Status.ACCEPTED},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(
            self.story_status_url,
            {'status': UserStory.Status.ACCEPTED},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Reset status and test rejection
        self.user_story.status = UserStory.Status.DONE
        self.user_story.save()
        
        response = self.client.post(
            self.story_status_url,
            {'status': UserStory.Status.REJECTED},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_remove_story_from_sprint_permissions(self):
        """Test that only Scrum Master can remove stories from sprints"""
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.remove_from_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.remove_from_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.remove_from_sprint_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the story was removed from the sprint
        self.sprint_story.refresh_from_db()
        self.assertIsNone(self.sprint_story.sprint)
    
    def test_add_stories_to_sprint_permissions(self):
        """Test that only Scrum Master can add stories to sprints"""
        # First update story points
        self.client.force_authenticate(user=self.scrum_master)
        self.client.post(self.story_points_url, {'story_points': 8}, format='json')
        
        add_to_sprint_data = {
            'story_ids': [self.user_story.id]
        }
        
        # Test with developer (should fail)
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.sprint_stories_url, add_to_sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.sprint_stories_url, add_to_sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.sprint_stories_url, add_to_sprint_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the story was added to the sprint
        self.user_story.refresh_from_db()
        self.assertEqual(self.user_story.sprint.id, self.sprint.id) 