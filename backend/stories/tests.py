from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from stories.models import UserStory, UserStoryComment
from projects.models import Project, ProjectMember
from sprints.models import Sprint

User = get_user_model()


class UserStoryAPITests(TestCase):
    """Test the user stories API endpoints"""
    
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
        
        self.product_owner = User.objects.create_user(
            username='productowner',
            email='po@example.com',
            password='testpassword123',
            first_name='Product',
            last_name='Owner',
            role=(User.Role.PRODUCT_OWNER 
                  if hasattr(User.Role, 'PRODUCT_OWNER') else 'PRODUCT_OWNER')
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
            user=self.product_owner,
            role=ProjectMember.Role.PRODUCT_OWNER
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
            title='Test User Story',
            description='As a user, I want to test the API',
            acceptance_criteria='The API tests must pass',
            priority=UserStory.Priority.MUST_HAVE,
            business_value=100,
            created_by=self.product_owner
        )
        
        # Set up URLs
        self.story_list_url = reverse(
            'stories:story-list-create', 
            args=[self.project.id]
        )
        self.story_detail_url = reverse(
            'stories:story-detail', 
            args=[self.project.id, self.story.id]
        )
        self.comment_list_url = reverse(
            'stories:story-comment-list-create', 
            args=[self.project.id, self.story.id]
        )
        self.backlog_url = reverse(
            'stories:product-backlog', 
            args=[self.project.id]
        )
        self.story_estimate_url = reverse(
            'stories:story-estimate', 
            args=[self.project.id, self.story.id]
        )
        
        # Authenticate as product owner
        self.client.force_authenticate(user=self.product_owner)
    
    def test_list_stories(self):
        """Test listing user stories for a project"""
        response = self.client.get(self.story_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], self.story.title)
    
    def test_create_story(self):
        """Test creating a new user story"""
        story_data = {
            'title': 'New User Story',
            'description': 'As a tester, I want to add a new story',
            'acceptance_criteria': 'The story should be created successfully',
            'priority': UserStory.Priority.SHOULD_HAVE,
            'business_value': 80
        }
        
        response = self.client.post(
            self.story_list_url, 
            story_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserStory.objects.count(), 2)
        
        new_story = UserStory.objects.get(title='New User Story')
        self.assertEqual(new_story.description, story_data['description'])
        self.assertEqual(
            new_story.acceptance_criteria, 
            story_data['acceptance_criteria']
        )
        self.assertEqual(new_story.priority, story_data['priority'])
        self.assertEqual(new_story.business_value, story_data['business_value'])
        self.assertEqual(new_story.project, self.project)
        self.assertEqual(new_story.created_by, self.product_owner)
    
    def test_retrieve_story(self):
        """Test retrieving a user story"""
        response = self.client.get(self.story_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.story.title)
        self.assertEqual(response.data['description'], self.story.description)
        self.assertEqual(
            response.data['acceptance_criteria'], 
            self.story.acceptance_criteria
        )
    
    def test_update_story(self):
        """Test updating a user story"""
        update_data = {
            'title': 'Updated User Story',
            'description': 'Updated description',
            'acceptance_criteria': 'Updated acceptance criteria',
            'priority': UserStory.Priority.COULD_HAVE,
            'business_value': 60
        }
        
        response = self.client.put(
            self.story_detail_url, 
            update_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.story.refresh_from_db()
        self.assertEqual(self.story.title, update_data['title'])
        self.assertEqual(self.story.description, update_data['description'])
        self.assertEqual(
            self.story.acceptance_criteria, 
            update_data['acceptance_criteria']
        )
        self.assertEqual(self.story.priority, update_data['priority'])
        self.assertEqual(self.story.business_value, update_data['business_value'])
    
    def test_delete_story(self):
        """Test deleting a user story"""
        response = self.client.delete(self.story_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(UserStory.objects.count(), 0)
    
    def test_estimate_story(self):
        """Test estimating a user story"""
        # Authenticate as scrum master for estimation
        self.client.force_authenticate(user=self.scrum_master)
        
        estimate_data = {
            'story_points': 8
        }
        
        response = self.client.post(
            self.story_estimate_url, 
            estimate_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.story.refresh_from_db()
        self.assertEqual(self.story.story_points, estimate_data['story_points'])
    
    def test_product_backlog(self):
        """Test retrieving the product backlog"""
        response = self.client.get(self.backlog_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Create another story with different priority
        UserStory.objects.create(
            project=self.project,
            title='Lower Priority Story',
            description='This is a lower priority story',
            acceptance_criteria='This should be after the main story',
            priority=UserStory.Priority.SHOULD_HAVE,
            business_value=50,
            created_by=self.product_owner
        )
        
        response = self.client.get(self.backlog_url)
        
        # Check that stories are ordered by priority
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['title'], self.story.title)
        self.assertEqual(response.data[1]['title'], 'Lower Priority Story')


class UserStoryCommentAPITests(TestCase):
    """Test the user story comments API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        
        # Create a test project
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project for API tests'
        )
        
        # Add user as project member
        ProjectMember.objects.create(
            project=self.project,
            user=self.user,
            role=ProjectMember.Role.DEVELOPER
        )
        
        # Create a test user story
        self.story = UserStory.objects.create(
            project=self.project,
            title='Test User Story',
            description='As a user, I want to test the API',
            acceptance_criteria='The API tests must pass',
            created_by=self.user
        )
        
        # Create a test comment
        self.comment = UserStoryComment.objects.create(
            story=self.story,
            author=self.user,
            content='This is a test comment'
        )
        
        # Set up URLs
        self.comment_list_url = reverse(
            'stories:story-comment-list-create', 
            args=[self.project.id, self.story.id]
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_list_comments(self):
        """Test listing comments for a user story"""
        response = self.client.get(self.comment_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], self.comment.content)
    
    def test_create_comment(self):
        """Test creating a comment for a user story"""
        comment_data = {
            'content': 'This is a new comment'
        }
        
        response = self.client.post(
            self.comment_list_url, 
            comment_data, 
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserStoryComment.objects.count(), 2)
        
        new_comment = UserStoryComment.objects.get(
            content='This is a new comment')
        self.assertEqual(new_comment.story, self.story)
        self.assertEqual(new_comment.author, self.user) 