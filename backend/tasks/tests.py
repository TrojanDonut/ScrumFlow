from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from tasks.models import Task
from stories.models import UserStory
from projects.models import Project, ProjectMember
from sprints.models import Sprint

User = get_user_model()


class TaskAPITests(TestCase):
    """Test the tasks API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.scrum_master = User.objects.create_user(
            username='scrummaster',
            email='scrummaster@example.com',
            password='testpassword123',
            first_name='Scrum',
            last_name='Master',
            role=(User.Role.SCRUM_MASTER 
                  if hasattr(User.Role, 'SCRUM_MASTER') else 'SCRUM_MASTER')
        )
        
        self.developer = User.objects.create_user(
            username='developer',
            email='developer@example.com',
            password='testpassword123',
            first_name='Dev',
            last_name='Eloper',
            role=(User.Role.DEVELOPER 
                  if hasattr(User.Role, 'DEVELOPER') else 'DEVELOPER')
        )
        
        # Create a test project
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project for API tests'
        )
        
        # Add users as project members
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
        
        # Create a test sprint
        self.sprint = Sprint.objects.create(
            project=self.project,
            start_date='2023-01-01',
            end_date='2023-01-14',
            created_by=self.scrum_master
        )
        
        # Create a test user story
        self.story = UserStory.objects.create(
            project=self.project,
            sprint=self.sprint,
            title='Test User Story',
            description='As a user, I want to test the API',
            acceptance_criteria='The API tests must pass',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            story_points=5,
            created_by=self.scrum_master
        )
        
        # Create a test task
        self.task = Task.objects.create(
            story=self.story,
            title='Test Task',
            description='A task to test the API',
            estimated_hours=4.0,
            created_by=self.scrum_master
        )
        
        # Set up URLs
        self.task_list_url = reverse(
            'tasks:task-list-create', 
            args=[self.story.id]
        )
        self.task_detail_url = reverse(
            'tasks:task-detail', 
            args=[self.story.id, self.task.id]
        )
        self.task_accept_url = reverse(
            'tasks:task-accept', 
            args=[self.task.id]
        )
        self.task_reject_url = reverse(
            'tasks:task-reject', 
            args=[self.task.id]
        )
        self.task_complete_url = reverse(
            'tasks:task-complete', 
            args=[self.task.id]
        )
        
        # Authenticate as scrum master
        self.client.force_authenticate(user=self.scrum_master)
    
    def test_list_tasks(self):
        """Test listing tasks for a user story"""
        response = self.client.get(self.task_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], self.task.title)
    
    def test_create_task(self):
        """Test creating a new task for a user story"""
        task_data = {
            'title': 'New Test Task',
            'description': 'A new task for testing',
            'estimated_hours': 3.5,
            'status': Task.Status.UNASSIGNED,
            'story': self.story.id,
            'created_by': self.scrum_master.id,
        }
        
        response = self.client.post(
            self.task_list_url, 
            task_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 2)
        new_task = Task.objects.get(title='New Test Task')
        self.assertEqual(new_task.description, task_data['description'])
        self.assertEqual(
            float(new_task.estimated_hours), 
            task_data['estimated_hours']
        )
        self.assertEqual(new_task.story, self.story)
        self.assertEqual(new_task.created_by, self.scrum_master)
    
    def test_retrieve_task(self):
        """Test retrieving a task"""
        response = self.client.get(self.task_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.task.title)
        self.assertEqual(response.data['description'], self.task.description)
        self.assertEqual(
            float(response.data['estimated_hours']), 
            float(self.task.estimated_hours)
        )
    
    def test_update_task(self):
        """Test updating a task"""
        update_data = {
            'title': 'Updated Task Title',
            'description': 'Updated task description',
            'estimated_hours': 5.0,
            'status': Task.Status.UNASSIGNED,
            'story': self.story.id,
            'created_by': self.scrum_master.id,
        }
        
        response = self.client.put(
            self.task_detail_url, 
            update_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, update_data['title'])
        self.assertEqual(self.task.description, update_data['description'])
        self.assertEqual(
            float(self.task.estimated_hours), 
            update_data['estimated_hours']
        )
    
    def test_partial_update_task(self):
        """Test partially updating a task"""
        update_data = {
            'title': 'Partially Updated Task'
        }
        
        response = self.client.patch(
            self.task_detail_url, 
            update_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, update_data['title'])
        # Description should remain unchanged
        self.assertEqual(self.task.description, 'A task to test the API')
    
    def test_delete_task(self):
        """Test deleting a task"""
        response = self.client.delete(self.task_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.count(), 0)
    
    def test_accept_task(self):
        """Test accepting a task"""
        # Authenticate as developer
        self.client.force_authenticate(user=self.developer)
        
        response = self.client.post(self.task_accept_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Task assigned')
        
        # Verify task status is updated
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.ASSIGNED)
    
    def test_reject_task(self):
        """Test rejecting a task"""
        # First assign the task
        self.task.status = Task.Status.ASSIGNED
        self.task.assigned_to = self.developer
        self.task.save()
        
        response = self.client.post(self.task_reject_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Task unassigned')
        
        # Verify task status is updated
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.UNASSIGNED)
        self.assertIsNone(self.task.assigned_to)
    
    def test_complete_task(self):
        """Test completing a task"""
        # First assign the task
        self.task.status = Task.Status.ASSIGNED
        self.task.assigned_to = self.developer
        self.task.save()
        
        # Authenticate as developer
        self.client.force_authenticate(user=self.developer)
        
        response = self.client.post(self.task_complete_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Task completed')
        
        # Verify task status is updated
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.COMPLETED) 