from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from tasks.models import Task, TimeLog, TaskSession
from stories.models import UserStory
from projects.models import Project, ProjectMember
from django.utils import timezone
import json
from datetime import timedelta
from decimal import Decimal

User = get_user_model()

class TimeLoggingTestCase(TestCase):
    """Test case for time logging functionality"""

    def setUp(self):
        """Set up test environment"""
        # Create users
        self.developer = User.objects.create_user(
            username='developer',
            email='developer@example.com',
            password='password123'
        )
        self.scrum_master = User.objects.create_user(
            username='scrummaster',
            email='scrummaster@example.com',
            password='password123'
        )
        
        # Create project
        self.project = Project.objects.create(
            name='Test Project',
            description='A project for testing',
            created_by=self.scrum_master
        )
        
        # Add members to project
        ProjectMember.objects.create(
            project=self.project,
            user=self.developer,
            role=ProjectMember.Role.DEVELOPER
        )
        
        ProjectMember.objects.create(
            project=self.project,
            user=self.scrum_master,
            role=ProjectMember.Role.SCRUM_MASTER
        )
        
        # Create user story
        self.story = UserStory.objects.create(
            name='Test Story',
            text='This is a test story',
            project=self.project,
            created_by=self.scrum_master,
            status='IN_PROGRESS'
        )
        
        # Create task
        self.task = Task.objects.create(
            title='Test Task',
            description='This is a test task',
            story=self.story,
            estimated_hours=10.0,
            created_by=self.scrum_master,
            assigned_to=self.developer,
            status=Task.Status.ASSIGNED
        )
        
        # Initialize client
        self.client = APIClient()
        
    def test_task_start_session(self):
        """Test starting a time logging session"""
        # Login as developer
        self.client.force_authenticate(user=self.developer)
        
        # First, set task status to IN_PROGRESS
        self.client.post(reverse('tasks:task-start', args=[self.task.id]))
        
        # Start a session
        response = self.client.post(reverse('tasks:start-task-session', args=[self.task.id]))
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('success' in response.data)
        self.assertTrue(response.data['success'])
        
        # Verify session created in DB
        self.assertEqual(TaskSession.objects.count(), 1)
        session = TaskSession.objects.first()
        self.assertEqual(session.task, self.task)
        self.assertEqual(session.user, self.developer)
        self.assertIsNotNone(session.start_time)
        self.assertIsNone(session.end_time)
    
    def test_task_stop_session(self):
        """Test stopping a time logging session"""
        # Login as developer
        self.client.force_authenticate(user=self.developer)
        
        # Set task status to IN_PROGRESS
        self.client.post(reverse('tasks:task-start', args=[self.task.id]))
        
        # Start a session
        self.client.post(reverse('tasks:start-task-session', args=[self.task.id]))
        
        # Fast-forward session start time to ensure measurable time
        session = TaskSession.objects.first()
        session.start_time = timezone.now() - timedelta(hours=2)
        session.save()
        
        # Stop the session
        response = self.client.post(reverse('tasks:stop-task-session', args=[self.task.id]))
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('success' in response.data)
        self.assertTrue(response.data['success'])
        
        # Verify session updated in DB
        session.refresh_from_db()
        self.assertIsNotNone(session.end_time)
        
        # Verify TimeLog created
        self.assertEqual(TimeLog.objects.count(), 1)
        log = TimeLog.objects.first()
        self.assertEqual(log.task, self.task)
        self.assertEqual(log.user, self.developer)
        self.assertAlmostEqual(float(log.hours_spent), 2.0, delta=0.1)
    
    def test_task_session_permissions(self):
        """Test permissions for session operations"""
        # Create another user
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='password123'
        )
        self.client.force_authenticate(user=other_user)
        
        # Try to start session for a task not assigned to this user
        response = self.client.post(reverse('tasks:start-task-session', args=[self.task.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_multiple_sessions_prevention(self):
        """Test that a user cannot have multiple active sessions for the same task"""
        # Login as developer
        self.client.force_authenticate(user=self.developer)
        
        # Set task status to IN_PROGRESS
        self.client.post(reverse('tasks:task-start', args=[self.task.id]))
        
        # Start a session
        self.client.post(reverse('tasks:start-task-session', args=[self.task.id]))
        
        # Try to start another session
        response = self.client.post(reverse('tasks:start-task-session', args=[self.task.id]))
        
        # Should succeed but return the existing session
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Only one session should exist
        self.assertEqual(TaskSession.objects.count(), 1)
    
    def test_manual_time_logging(self):
        """Test manual time logging via stop API"""
        # Login as developer
        self.client.force_authenticate(user=self.developer)
        
        # Set task status to IN_PROGRESS
        self.client.post(reverse('tasks:task-start', args=[self.task.id]))
        
        # Log time manually
        data = {
            'hours_spent': 3.5,
            'description': 'Manual time entry'
        }
        response = self.client.post(
            reverse('tasks:task-stop', args=[self.task.id]),
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify TimeLog created
        self.assertEqual(TimeLog.objects.count(), 1)
        log = TimeLog.objects.first()
        self.assertEqual(log.task, self.task)
        self.assertEqual(log.user, self.developer)
        self.assertEqual(log.hours_spent, Decimal('3.5'))
        self.assertEqual(log.description, 'Manual time entry')
        
        # Verify task is still IN_PROGRESS
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.IN_PROGRESS)
    
    def test_time_log_list(self):
        """Test fetching time logs for a task"""
        # Login as developer
        self.client.force_authenticate(user=self.developer)
        
        # Create a time log
        TimeLog.objects.create(
            task=self.task,
            user=self.developer,
            hours_spent=2.5,
            date=timezone.now().date(),
            description='Test log'
        )
        
        # Fetch time logs
        response = self.client.get(reverse('tasks:task-timelogs', args=[self.task.id]))
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(Decimal(response.data[0]['hours_spent']), Decimal('2.5'))
        self.assertEqual(response.data[0]['description'], 'Test log') 