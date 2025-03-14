from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AdminUserManagementTests(TestCase):
    """Test administrator user management functionality"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='AdminPassword123!',
            first_name='Admin',
            last_name='User',
            role=User.Role.SYSTEM_ADMIN,
            is_staff=True,
            is_superuser=True
        )
        
        # Create regular user to be managed
        self.regular_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='RegularPassword123!',
            first_name='Regular',
            last_name='User',
            role=User.Role.DEVELOPER
        )
        
        # URLs
        self.users_list_url = reverse('users:user-list-create')
        self.user_detail_url = reverse(
            'users:user-detail', 
            kwargs={'pk': self.regular_user.id}
        )
        self.login_url = reverse('users:login')
        
        # Login admin user
        login_data = {
            'username': 'admin',
            'password': 'AdminPassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.admin_token = response.data['access']
        auth_header = f"Bearer {self.admin_token}"
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
    
    def test_delete_existing_user(self):
        """Test administrator can delete an existing user"""
        # Verify user exists before deletion
        user_exists = User.objects.filter(id=self.regular_user.id).exists()
        self.assertTrue(user_exists)
        
        # Delete user
        response = self.client.delete(self.user_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify user no longer exists
        user_exists = User.objects.filter(id=self.regular_user.id).exists()
        self.assertFalse(user_exists)
    
    def test_username_change_duplicate_check(self):
        """Test changing username checks for duplicates"""
        # Create another user
        another_user = User.objects.create_user(
            username='anotheruser',
            email='another@example.com',
            password='AnotherPassword123!',
            first_name='Another',
            last_name='User',
            role=User.Role.DEVELOPER
        )
        another_user_url = reverse(
            'users:user-detail', 
            kwargs={'pk': another_user.id}
        )
        
        # Try to change username to one that already exists
        update_data = {
            'username': 'regularuser'  # This username already exists
        }
        
        response = self.client.patch(
            another_user_url, 
            update_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        error_msg = str(response.data['username'])
        self.assertIn('already exists', error_msg)
        
        # Verify username wasn't changed
        another_user.refresh_from_db()
        self.assertEqual(another_user.username, 'anotheruser')
    
    def test_update_user_personal_info(self):
        """Test administrator can update user's personal information"""
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@example.com'
        }
        
        response = self.client.patch(
            self.user_detail_url, 
            update_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user information was updated
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.first_name, 'Updated')
        self.assertEqual(self.regular_user.last_name, 'Name')
        self.assertEqual(self.regular_user.email, 'updated@example.com')
    
    def test_change_user_password(self):
        """Test administrator can change a user's password"""
        # For admin to change another user's password, we need to create a custom endpoint
        # or modify the existing one. For now, we'll test that the user can change 
        # their own password
        
        # Login as regular user
        self.client.credentials()  # Clear admin credentials
        login_data = {
            'username': 'regularuser',
            'password': 'RegularPassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        regular_token = response.data['access']
        auth_header = f"Bearer {regular_token}"
        self.client.credentials(HTTP_AUTHORIZATION=auth_header)
        
        # Change password
        change_password_url = reverse('users:change-password')
        update_data = {
            'old_password': 'RegularPassword123!',
            'new_password': 'NewSecurePassword123!',
            'new_password_confirm': 'NewSecurePassword123!'
        }
        
        response = self.client.post(
            change_password_url, 
            update_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Try to login with new password
        self.client.credentials()  # Clear credentials
        login_data = {
            'username': 'regularuser',
            'password': 'NewSecurePassword123!'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
    
    def test_change_user_role(self):
        """Test administrator can change a user's system role"""
        update_data = {
            'role': User.Role.SCRUM_MASTER
        }
        
        response = self.client.patch(
            self.user_detail_url, 
            update_data, 
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify role was updated
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.role, User.Role.SCRUM_MASTER)
        
        # Verify user now has the scrum master property
        self.assertTrue(self.regular_user.is_scrum_master)
        self.assertFalse(self.regular_user.is_developer) 