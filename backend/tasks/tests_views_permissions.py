from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from projects.models import Project, ProjectMember
from sprints.models import Sprint
from stories.models import UserStory
from tasks.models import Task
from datetime import date, timedelta

User = get_user_model()


class TaskPermissionsTestCase(TestCase):
    """Test case for Task view permissions"""
    
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
        
        self.developer2 = User.objects.create_user(
            username='developer2',
            email='dev2@example.com',
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
        
        ProjectMember.objects.create(
            project=self.project,
            user=self.developer2,
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
        
        # Create a user story in the sprint
        self.user_story = UserStory.objects.create(
            name='Test Story',
            text='As a user, I want to test task permissions.',
            acceptance_tests='Verify task permissions work correctly.',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            project=self.project,
            sprint=self.sprint,
            created_by=self.product_owner,
            story_points=5
        )
        
        # Create a task
        self.task = Task.objects.create(
            title='Test Task',
            description='Test task description',
            story=self.user_story,
            status=Task.Status.UNASSIGNED,
            estimated_hours=4,
            created_by=self.scrum_master
        )
        
        # Create a task assigned to a developer
        self.assigned_task = Task.objects.create(
            title='Assigned Task',
            description='This task is assigned to a developer',
            story=self.user_story,
            status=Task.Status.ASSIGNED,
            estimated_hours=4,
            assigned_to=self.developer,
            created_by=self.scrum_master
        )
        
        # URLs for testing
        self.tasks_list_url = reverse('tasks:tasks-list-create')
        self.task_detail_url = reverse('tasks:task-detail', kwargs={'pk': self.task.id})
        self.assigned_task_detail_url = reverse('tasks:task-detail', kwargs={'pk': self.assigned_task.id})
        self.project_tasks_url = reverse('tasks:project-tasks', kwargs={'project_id': self.project.id})
        self.story_tasks_url = reverse('tasks:story-tasks', kwargs={'story_id': self.user_story.id})
        self.task_assign_url = reverse('tasks:task-assign', kwargs={'task_id': self.task.id})
        self.task_unassign_url = reverse('tasks:task-unassign', kwargs={'task_id': self.assigned_task.id})
        self.task_start_url = reverse('tasks:task-start', kwargs={'task_id': self.assigned_task.id})
        self.task_stop_url = reverse('tasks:task-stop', kwargs={'task_id': self.assigned_task.id})
        self.task_complete_url = reverse('tasks:task-complete', kwargs={'task_id': self.assigned_task.id})
    
    def test_task_list_view_permissions(self):
        """Test that any project member can view the tasks list"""
        # Test with product owner
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.get(self.tasks_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.get(self.tasks_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.get(self.tasks_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.get(self.tasks_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_task_create_permissions(self):
        """Test that only Scrum Master and Developers can create tasks"""
        task_data = {
            'title': 'New Test Task',
            'description': 'New task description',
            'story': self.user_story.id,
            'estimated_hours': 5
        }
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.story_tasks_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.story_tasks_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with developer
        self.client.force_authenticate(user=self.developer)
        task_data['title'] = 'Developer Task'
        response = self.client.post(self.story_tasks_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test with non-member (should fail)
        self.client.force_authenticate(user=self.non_member)
        response = self.client.post(self.story_tasks_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_task_update_permissions(self):
        """Test task update permissions"""
        task_data = {
            'title': 'Updated Task Name',
            'estimated_hours': 6
        }
        
        # Test with scrum master on any task
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.patch(self.task_detail_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with assigned developer on their own task
        self.client.force_authenticate(user=self.developer)
        task_data['title'] = 'Developer Update'
        response = self.client.patch(self.assigned_task_detail_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with developer on non-assigned task (should fail)
        response = self.client.patch(self.task_detail_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.patch(self.task_detail_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with different developer (should fail)
        self.client.force_authenticate(user=self.developer2)
        response = self.client.patch(self.assigned_task_detail_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_task_delete_permissions(self):
        """Test that only Scrum Master can delete tasks"""
        # Create a test task to delete
        delete_task = Task.objects.create(
            title='Delete Task',
            description='Task to be deleted',
            story=self.user_story,
            status=Task.Status.UNASSIGNED,
            estimated_hours=2,
            created_by=self.scrum_master
        )
        
        delete_url = reverse('tasks:task-detail', kwargs={'pk': delete_task.id})
        
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
    
    def test_task_assign_permissions(self):
        """Test that only Developers and Scrum Master can self-assign tasks"""
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.task_assign_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.task_assign_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task was assigned
        self.task.refresh_from_db()
        self.assertEqual(self.task.assigned_to, self.developer)
        
        # Create a new task for testing scrum master assignment
        new_task = Task.objects.create(
            title='New Test Task',
            description='Task for scrum master assignment',
            story=self.user_story,
            status=Task.Status.UNASSIGNED,
            estimated_hours=3,
            created_by=self.scrum_master
        )
        
        new_task_assign_url = reverse('tasks:task-assign', kwargs={'task_id': new_task.id})
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(new_task_assign_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task was assigned
        new_task.refresh_from_db()
        self.assertEqual(new_task.assigned_to, self.scrum_master)
    
    def test_task_unassign_permissions(self):
        """Test task unassign permissions"""
        # Test with non-assigned developer (should fail)
        self.client.force_authenticate(user=self.developer2)
        response = self.client.post(self.task_unassign_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.task_unassign_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.task_unassign_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task was unassigned
        self.assigned_task.refresh_from_db()
        self.assertIsNone(self.assigned_task.assigned_to)
        
        # Reassign the task for further testing
        self.assigned_task.assigned_to = self.developer
        self.assigned_task.save()
        
        # Test with assigned developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.task_unassign_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task was unassigned
        self.assigned_task.refresh_from_db()
        self.assertIsNone(self.assigned_task.assigned_to)
    
    def test_task_start_and_stop_permissions(self):
        """Test that only assigned user can start/stop working on a task"""
        # Test with non-assigned developer (should fail)
        self.client.force_authenticate(user=self.developer2)
        response = self.client.post(self.task_start_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with scrum master (should fail if not assigned)
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(self.task_start_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with assigned developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.task_start_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task status was updated
        self.assigned_task.refresh_from_db()
        self.assertEqual(self.assigned_task.status, Task.Status.IN_PROGRESS)
        
        # Test stop with non-assigned developer (should fail)
        self.client.force_authenticate(user=self.developer2)
        response = self.client.post(self.task_stop_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test stop with assigned developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.task_stop_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_task_complete_permissions(self):
        """Test task completion permissions"""
        # Test with non-assigned developer (should fail)
        self.client.force_authenticate(user=self.developer2)
        response = self.client.post(self.task_complete_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with product owner (should fail)
        self.client.force_authenticate(user=self.product_owner)
        response = self.client.post(self.task_complete_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with assigned developer
        self.client.force_authenticate(user=self.developer)
        response = self.client.post(self.task_complete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task was marked as complete
        self.assigned_task.refresh_from_db()
        self.assertEqual(self.assigned_task.status, Task.Status.COMPLETED)
        
        # Create a new task for testing Scrum Master completion
        new_task = Task.objects.create(
            title='SM Complete Task',
            description='Task for scrum master completion',
            story=self.user_story,
            status=Task.Status.IN_PROGRESS,
            estimated_hours=3,
            assigned_to=self.developer2,
            created_by=self.scrum_master
        )
        
        sm_complete_url = reverse('tasks:task-complete', kwargs={'task_id': new_task.id})
        
        # Test with scrum master (should work even if not assigned)
        self.client.force_authenticate(user=self.scrum_master)
        response = self.client.post(sm_complete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify task was marked as complete
        new_task.refresh_from_db()
        self.assertEqual(new_task.status, Task.Status.COMPLETED) 