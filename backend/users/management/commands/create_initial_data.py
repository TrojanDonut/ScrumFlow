from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from projects.models import Project, ProjectMember
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates initial users and data for the application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating initial data...')
        
        with transaction.atomic():
            # Create admin user if it doesn't exist
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@example.com',
                    password='admin123',
                    role=User.Role.SYSTEM_ADMIN
                )
                self.stdout.write(self.style.SUCCESS('Admin user created'))
            
            # Create a test user for each role
            roles = [
                (User.Role.PRODUCT_OWNER, 'product_owner'),
                (User.Role.SCRUM_MASTER, 'scrum_master'),
                (User.Role.DEVELOPER, 'developer')
            ]
            
            for role, username in roles:
                if not User.objects.filter(username=username).exists():
                    User.objects.create_user(
                        username=username,
                        email=f'{username}@example.com',
                        password='password123',
                        role=role,
                        first_name=username.capitalize().split('_')[0],
                        last_name=username.capitalize().split('_')[-1] if '_' in username else ''
                    )
                    self.stdout.write(self.style.SUCCESS(f'User {username} created'))
            
            # Create a sample project
            if not Project.objects.filter(name='Sample Project').exists():
                project = Project.objects.create(
                    name='Sample Project',
                    description='This is a sample project for testing the Scrum Workflow Application.'
                )
                
                # Add members to the project
                for user in User.objects.exclude(username='admin'):
                    role = ProjectMember.Role.DEVELOPER
                    if user.role == User.Role.PRODUCT_OWNER:
                        role = ProjectMember.Role.PRODUCT_OWNER
                    elif user.role == User.Role.SCRUM_MASTER:
                        role = ProjectMember.Role.SCRUM_MASTER
                    
                    ProjectMember.objects.create(
                        project=project,
                        user=user,
                        role=role
                    )
                
                self.stdout.write(self.style.SUCCESS('Sample project created with members'))
        
        self.stdout.write(self.style.SUCCESS('Initial data creation complete!')) 