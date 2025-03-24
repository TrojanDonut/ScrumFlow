from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from projects.models import Project, ProjectMember
from stories.models import UserStory
from tasks.models import Task

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates initial users and data for the application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating initial data...')
        
        with transaction.atomic():
            # Create admin user if it doesn't exist
            if not User.objects.filter(username='admin').exists():
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@example.com',
                    password='admin123',
                    role=User.user_type.ADMIN
                )
                self.stdout.write(self.style.SUCCESS(f'Admin user created: {admin_user.username}'))
            else:
                self.stdout.write(self.style.SUCCESS('Admin user already exists'))
            
            # Create a test user for each role
            roles = [
                (ProjectMember.Role.PRODUCT_OWNER, 'product_owner'),
                (ProjectMember.Role.SCRUM_MASTER, 'scrum_master'),
                (ProjectMember.Role.DEVELOPER, 'developer')
            ]
            
            for role, username in roles:
                if not User.objects.filter(username=username).exists():
                    user = User.objects.create_user(
                        username=username,
                        email=f'{username}@example.com',
                        password='password123',
                        role=role,
                        first_name=username.capitalize().split('_')[0],
                        last_name=username.capitalize().split('_')[-1] if '_' in username else ''
                    )
                    self.stdout.write(self.style.SUCCESS(f'User created: {user.username}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'User {username} already exists'))
            
            # Temporarily commented out project creation for testing authentication
            try:
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
                else:
                    self.stdout.write(self.style.SUCCESS('Sample project already exists'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating sample project: {str(e)}'))

            # Create initial user stories
            try:
                project = Project.objects.get(name='Sample Project')
                created_by_user = User.objects.get(username='product_owner')
                
                if not UserStory.objects.filter(title='Initial User Story').exists():
                    user_story = UserStory.objects.create(
                        project=project,
                        sprint=None,
                        title='Initial User Story',
                        description='This is an initial user story for testing.',
                        acceptance_criteria='Acceptance criteria for the initial user story.',
                        priority=UserStory.Priority.SHOULD_HAVE,
                        business_value=100,
                        story_points=5,
                        status=UserStory.Status.NOT_STARTED,
                        created_by=created_by_user
                    )
                    self.stdout.write(self.style.SUCCESS(f'User story created: {user_story.title}'))
                else:
                    self.stdout.write(self.style.SUCCESS('Initial user story already exists'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating initial user story: {str(e)}'))
            
            # Create initial tasks
            try:
                user_story = UserStory.objects.get(title='Initial User Story')
                tasks = [
                    {
                        'title': 'Initial Task 1',
                        'description': 'This is the first initial task for testing.',
                        'status': 'TODO',
                        'assigned_to': User.objects.get(username='developer'),
                        'created_by': User.objects.get(username='product_owner')
                    },
                    {
                        'title': 'Initial Task 2',
                        'description': 'This is the second initial task for testing.',
                        'status': 'IN_PROGRESS',
                        'assigned_to': User.objects.get(username='scrum_master'),
                        'created_by': User.objects.get(username='scrum_master')
                    },
                    {
                        'title': 'Initial Task 3',
                        'description': 'This is the third initial task for testing.',
                        'status': 'DONE',
                        'assigned_to': User.objects.get(username='product_owner'),
                        'created_by': User.objects.get(username='product_owner')
                    }
                ]
                
                for task_data in tasks:
                    if not Task.objects.filter(title=task_data['title']).exists():
                        task = Task.objects.create(
                            story=user_story,
                            title=task_data['title'],
                            description=task_data['description'],
                            created_by=task_data['created_by'],
                            assigned_to=task_data['assigned_to'],
                            status=task_data['status']
                        )
                        self.stdout.write(self.style.SUCCESS(f'Task created: {task.title}'))
                    else:
                        self.stdout.write(self.style.SUCCESS(f'Task {task_data["title"]} already exists'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error creating initial tasks: {str(e)}'))
            
        self.stdout.write(self.style.SUCCESS('Initial data creation complete!')) 