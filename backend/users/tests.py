from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import json

User = get_user_model()


class UserAuthenticationTests(TestCase):
    """Test user authentication functionality"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('users:register')
        self.login_url = reverse('users:login')
        self.logout_url = reverse('users:logout')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123',
            'password_confirm': 'testpassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': User.Role.DEVELOPER
        }

    def test_user_registration(self):
        """Test user registration"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)
        self.assertTrue('user' in response.data)
        self.assertEqual(response.data['user']['username'], self.user_data['username'])
        self.assertEqual(response.data['user']['email'], self.user_data['email'])
        self.assertEqual(response.data['user']['first_name'], self.user_data['first_name'])
        self.assertEqual(response.data['user']['last_name'], self.user_data['last_name'])
        self.assertEqual(response.data['user']['role'], self.user_data['role'])
        
    def test_user_registration_case_insensitive_username(self):
        """Test that username validation during registration is case-insensitive"""
        # First create a user
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Try to create another user with the same username but different case
        new_user_data = self.user_data.copy()
        new_user_data['username'] = self.user_data['username'].upper()
        new_user_data['email'] = 'different@example.com'  # Need a different email
        
        response = self.client.post(self.register_url, new_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        self.assertIn('already taken', str(response.data['username']))

    def test_user_login(self):
        """Test user login"""
        # Create a user
        user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            role=self.user_data['role']
        )

        # Login
        login_data = {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)
        self.assertTrue('user' in response.data)
        self.assertEqual(response.data['user']['username'], self.user_data['username'])

    def test_user_logout(self):
        """Test user logout"""
        # Create a user
        user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name'],
            role=self.user_data['role']
        )

        # Login
        login_data = {
            'username': self.user_data['username'],
            'password': self.user_data['password']
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        # Logout
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
        logout_data = {'refresh': login_response.data['refresh']}
        response = self.client.post(self.logout_url, logout_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Successfully logged out.')

class UserProfileUpdateTests(TestCase):
    """Test the user profile update API"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('users:profile-update')

    def test_update_profile_success(self):
        """Test updating user profile with valid data"""
        payload = {
            'username': 'newtestuser',
            'email': 'newtest@example.com',
            'first_name': 'New',
            'last_name': 'Name'
        }

        response = self.client.put(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, payload['username'])
        self.assertEqual(self.user.email, payload['email'])
        self.assertEqual(self.user.first_name, payload['first_name'])
        self.assertEqual(self.user.last_name, payload['last_name'])

    def test_update_profile_duplicate_username(self):
        """Test updating user profile with a duplicate username"""
        # Create another user with a different username
        User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='testpassword123'
        )

        payload = {
            'username': 'existinguser',
            'email': 'newtest@example.com',
            'first_name': 'New',
            'last_name': 'Name'
        }

        response = self.client.put(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        
    def test_update_profile_case_insensitive_username(self):
        """Test that username validation is case-insensitive"""
        # Create another user with a different username
        User.objects.create_user(
            username='ExistingUser',  # Note the capitalization
            email='existing@example.com',
            password='testpassword123'
        )

        # Try to update with the same username but different case
        payload = {
            'username': 'existinguser',  # lowercase version
            'email': 'newtest@example.com',
            'first_name': 'New',
            'last_name': 'Name'
        }

        response = self.client.put(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        
    def test_update_profile_duplicate_email(self):
        """Test updating user profile with a duplicate email"""
        # Create another user with a different email
        User.objects.create_user(
            username='anotheruser',
            email='existing@example.com',
            password='testpassword123'
        )

        payload = {
            'username': 'newtestuser',
            'email': 'existing@example.com',
            'first_name': 'New',
            'last_name': 'Name'
        }

        response = self.client.put(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_update_profile_partial(self):
        """Test updating only some fields of the user profile"""
        payload = {
            'first_name': 'NewFirstName',
            'last_name': 'NewLastName'
        }

        response = self.client.patch(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, payload['first_name'])
        self.assertEqual(self.user.last_name, payload['last_name'])
        # Username and email should remain unchanged
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')

    def test_update_profile_unauthenticated(self):
        """Test that unauthenticated users cannot update profiles"""
        self.client.force_authenticate(user=None)

        payload = {
            'username': 'newtestuser',
            'email': 'newtest@example.com'
        }

        response = self.client.put(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
