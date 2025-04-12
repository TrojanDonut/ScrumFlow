from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from projects.models import Project, ProjectMember
from sprints.models import Sprint
from stories.models import UserStory
from tasks.models import Task, TimeLog
import datetime
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = (
        'Creates initial users and data for testing the application'
    )

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating initial data...')

        # Store original save method
        original_save = Sprint.save

        # Override save method to bypass validation
        def bypass_validation_save(self, *args, **kwargs):
            # Skip validation during initial data creation
            if hasattr(self, '_skip_validation') and self._skip_validation:
                super(Sprint, self).save(*args, **kwargs)
            else:
                original_save(self, *args, **kwargs)

        # Replace save method
        Sprint.save = bypass_validation_save

        with transaction.atomic():
            # Create admin user if it doesn't exist
            if not User.objects.filter(username__iexact='admin').exists():
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@example.com',
                    password='admin123',
                    user_type=User.UserType.ADMIN
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Admin user created: {admin_user.username}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('Admin user already exists')
                )

            # Create a test user for each role
            roles = [
                (ProjectMember.Role.PRODUCT_OWNER, 'product_owner'),
                (ProjectMember.Role.SCRUM_MASTER, 'scrum_master'),
                (ProjectMember.Role.DEVELOPER, 'developer'),
                (ProjectMember.Role.DEVELOPER, 'developer2'),
                (ProjectMember.Role.DEVELOPER, 'developer3'),
                (ProjectMember.Role.DEVELOPER, 'developer4'),
                (ProjectMember.Role.DEVELOPER, 'developer5'),
                (ProjectMember.Role.DEVELOPER, 'developer6')
            ]

            for role, username in roles:
                if not User.objects.filter(username__iexact=username).exists():
                    user = User.objects.create_user(
                        username=username,
                        email=f'{username}@example.com',
                        password='password123',
                        user_type=User.UserType.USER,
                        first_name=username.capitalize().split('_')[0],
                        last_name=(
                            username.capitalize().split('_')[-1]
                            if '_' in username else ''
                        )
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'User created: {user.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'User {username} already exists')
                    )

            # Create a non-member user for testing
            if not User.objects.filter(username__iexact='non_member').exists():
                non_member = User.objects.create_user(
                    username='non_member',
                    email='non_member@example.com',
                    password='password123',
                    user_type=User.UserType.USER,
                    first_name='Non',
                    last_name='Member'
                )
                self.stdout.write(
                    self.style.SUCCESS(f'User created: {non_member.username}')
                )

            # Create projects
            try:
                # First project with all members
                if not Project.objects.filter(name='Scrum Project 1').exists():
                    # Fetch the users for product_owner and scrum_master roles
                    product_owner_user = User.objects.get(
                        username='product_owner'
                    )
                    scrum_master_user = User.objects.get(
                        username='scrum_master'
                    )
                    developer_user = User.objects.get(username='developer')
                    developer2_user = User.objects.get(username='developer2')
                    developer3_user = User.objects.get(username='developer3')
                    developer4_user = User.objects.get(username='developer4')
                    developer5_user = User.objects.get(username='developer5')
                    developer6_user = User.objects.get(username='developer6')

                    project1 = Project.objects.create(
                        name='Scrum Project 1',
                        description=(
                            'This is the first Scrum project with multiple '
                            'sprints, stories, and tasks for testing.'
                        ),
                        product_owner=product_owner_user,
                        scrum_master=scrum_master_user
                    )

                    # Add members to the project
                    ProjectMember.objects.create(
                        project=project1,
                        user=product_owner_user,
                        role=ProjectMember.Role.PRODUCT_OWNER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=scrum_master_user,
                        role=ProjectMember.Role.SCRUM_MASTER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=developer_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=developer2_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=developer3_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=developer4_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=developer5_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project1,
                        user=developer6_user,
                        role=ProjectMember.Role.DEVELOPER
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            'Scrum Project 1 created with members'
                        )
                    )
                else:
                    project1 = Project.objects.get(name='Scrum Project 1')
                    self.stdout.write(
                        self.style.SUCCESS(
                            'Scrum Project 1 already exists'
                        )
                    )
                
                # Second project with different team composition
                if not Project.objects.filter(name='Scrum Project 2').exists():
                    product_owner_user = User.objects.get(
                        username='product_owner'
                    )
                    scrum_master_user = User.objects.get(
                        username='scrum_master'
                    )
                    developer2_user = User.objects.get(username='developer2')
                    developer3_user = User.objects.get(username='developer3')
                    developer4_user = User.objects.get(username='developer4')

                    project2 = Project.objects.create(
                        name='Scrum Project 2',
                        description=(
                            'This is the second Scrum project with a '
                            'different team composition for testing.'
                        ),
                        product_owner=product_owner_user,
                        scrum_master=scrum_master_user
                    )

                    # Add members to the project
                    ProjectMember.objects.create(
                        project=project2,
                        user=product_owner_user,
                        role=ProjectMember.Role.PRODUCT_OWNER
                    )
                    ProjectMember.objects.create(
                        project=project2,
                        user=scrum_master_user,
                        role=ProjectMember.Role.SCRUM_MASTER
                    )
                    ProjectMember.objects.create(
                        project=project2,
                        user=developer2_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project2,
                        user=developer3_user,
                        role=ProjectMember.Role.DEVELOPER
                    )
                    ProjectMember.objects.create(
                        project=project2,
                        user=developer4_user,
                        role=ProjectMember.Role.DEVELOPER
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            'Scrum Project 2 created with members'
                        )
                    )
                else:
                    project2 = Project.objects.get(name='Scrum Project 2')
                    self.stdout.write(
                        self.style.SUCCESS(
                            'Scrum Project 2 already exists'
                        )
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f'Error creating projects: {str(e)}'
                    )
                )
            
            # Create past, current and future sprints for Project 1
            try:
                project1 = Project.objects.get(name='Scrum Project 1')
                today = datetime.date.today()
                
                # Calculate dates that avoid weekends for start/end dates
                def get_weekday_date(base_date):
                    while base_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
                        base_date += datetime.timedelta(days=1)
                    return base_date
                
                # Past sprint (completed)
                past_start = get_weekday_date(
                    today - datetime.timedelta(days=30)
                )
                past_end = get_weekday_date(
                    past_start + datetime.timedelta(days=14)
                )
                
                if not Sprint.objects.filter(
                    project=project1, start_date=past_start
                ).exists():
                    # Create sprint with validation bypass
                    past_sprint = Sprint(
                        project=project1,
                        start_date=past_start,
                        end_date=past_end,
                        velocity=20,
                        is_completed=True,
                        created_by=User.objects.get(username='scrum_master')
                    )
                    past_sprint._skip_validation = True
                    past_sprint.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            'Past sprint created for Project 1'
                        )
                    )
                else:
                    past_sprint = Sprint.objects.get(
                        project=project1, start_date=past_start
                    )
                    self.stdout.write(
                        self.style.SUCCESS('Past sprint already exists')
                    )
                
                # Current sprint (active)
                current_start = get_weekday_date(
                    today - datetime.timedelta(days=7)
                )
                current_end = get_weekday_date(
                    current_start + datetime.timedelta(days=14)
                )
                
                if not Sprint.objects.filter(
                    project=project1, start_date=current_start
                ).exists():
                    # Create sprint with validation bypass
                    current_sprint = Sprint(
                        project=project1,
                        start_date=current_start,
                        end_date=current_end,
                        velocity=15,
                        created_by=User.objects.get(username='scrum_master')
                    )
                    current_sprint._skip_validation = True
                    current_sprint.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            'Current sprint created for Project 1'
                        )
                    )
                else:
                    current_sprint = Sprint.objects.get(
                        project=project1, start_date=current_start
                    )
                    self.stdout.write(
                        self.style.SUCCESS('Current sprint already exists')
                    )
                
                # Future sprint (planned)
                future_start = get_weekday_date(
                    today + datetime.timedelta(days=14)
                )
                future_end = get_weekday_date(
                    future_start + datetime.timedelta(days=14)
                )
                
                if not Sprint.objects.filter(
                    project=project1, start_date=future_start
                ).exists():
                    # Create sprint with validation bypass
                    future_sprint = Sprint(
                        project=project1,
                        start_date=future_start,
                        end_date=future_end,
                        velocity=18,
                        created_by=User.objects.get(username='scrum_master')
                    )
                    future_sprint._skip_validation = True
                    future_sprint.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            'Future sprint created for Project 1'
                        )
                    )
                else:
                    future_sprint = Sprint.objects.get(
                        project=project1, start_date=future_start
                    )
                    self.stdout.write(
                        self.style.SUCCESS('Future sprint already exists')
                    )

                # Create a sprint for Project 2
                if not Sprint.objects.filter(project=project2).exists():
                    # Create sprint with validation bypass
                    project2_sprint = Sprint(
                        project=project2,
                        start_date=current_start,
                        end_date=current_end,
                        velocity=12,
                        created_by=User.objects.get(username='scrum_master')
                    )
                    project2_sprint._skip_validation = True
                    project2_sprint.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            'Sprint created for Project 2'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS('Project 2 sprint already exists')
                    )

                # Create user stories for different sprints
                product_owner = User.objects.get(username='product_owner')
                developer = User.objects.get(username='developer')
                developer2 = User.objects.get(username='developer2')
                developer3 = User.objects.get(username='developer3')

                # Create backlog stories first
                backlog_stories = [
                    {
                        'name': 'Backlog Story 1',
                        'text': (
                            'As a user, I want to see my backlog items'
                        ),
                        'points': 5,
                        'status': UserStory.Status.NOT_STARTED,
                        'assignee': None,
                        'acceptance_tests': (
                            'Must show all backlog items\n'
                            'Must be sortable by priority'
                        ),
                        'business_value': 100
                    },
                    {
                        'name': 'Backlog Story 2',
                        'text': (
                            'As a user, I want to prioritize my backlog'
                        ),
                        'points': 8,
                        'status': UserStory.Status.NOT_STARTED,
                        'assignee': None,
                        'acceptance_tests': (
                            'Must allow drag and drop prioritization\n'
                            'Must save order'
                        ),
                        'business_value': 200
                    }
                ]

                for story_data in backlog_stories:
                    if not UserStory.objects.filter(
                        name=story_data['name']
                    ).exists():
                        story = UserStory.objects.create(
                            name=story_data['name'],
                            text=story_data['text'],
                            story_points=story_data['points'],
                            status=story_data['status'],
                            project=project1,
                            created_by=product_owner,
                            assigned_to=story_data['assignee'],
                            acceptance_tests=story_data['acceptance_tests'],
                            business_value=story_data['business_value']
                        )
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Created backlog story: {story.name}'
                            )
                        )

                # Stories for past sprint
                if past_sprint:
                    past_stories = [
                        {
                            'name': 'User Authentication',
                            'text': 'As a user, I want to authenticate',
                            'points': 5,
                            'status': UserStory.Status.ACCEPTED,
                            'assignee': developer,
                            'acceptance_tests': (
                                'Must support email/password login\n'
                                'Must handle invalid credentials'
                            ),
                            'business_value': 300
                        },
                        {
                            'name': 'Dashboard View',
                            'text': 'As a user, I want to see my dashboard',
                            'points': 8,
                            'status': UserStory.Status.ACCEPTED,
                            'assignee': developer2,
                            'acceptance_tests': (
                                'Must show project overview\n'
                                'Must display recent activity'
                            ),
                            'business_value': 200
                        }
                    ]

                    for story_data in past_stories:
                        if not UserStory.objects.filter(
                            name=story_data['name']
                        ).exists():
                            story = UserStory.objects.create(
                                name=story_data['name'],
                                text=story_data['text'],
                                story_points=story_data['points'],
                                status=story_data['status'],
                                project=project1,
                                sprint=past_sprint,
                                created_by=product_owner,
                                assigned_to=story_data['assignee'],
                                acceptance_tests=story_data['acceptance_tests'],
                                business_value=story_data['business_value']
                            )
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Created past sprint story: {story.name}'
                                )
                            )

                # Stories for current sprint
                if current_sprint:
                    current_stories = [
                        {
                            'name': 'Task Management',
                            'text': 'As a user, I want to manage tasks',
                            'points': 13,
                            'status': UserStory.Status.IN_PROGRESS,
                            'assignee': developer,
                            'acceptance_tests': (
                                'Must create/edit/delete tasks\n'
                                'Must track time'
                            ),
                            'business_value': 300
                        },
                        {
                            'name': 'Sprint Planning',
                            'text': (
                                'As a scrum master, I want to plan sprints'
                            ),
                            'points': 8,
                            'status': UserStory.Status.NOT_STARTED,
                            'assignee': developer2,
                            'acceptance_tests': (
                                'Must set sprint dates\n'
                                'Must assign stories'
                            ),
                            'business_value': 400
                        },
                        {
                            'name': 'User Profile',
                            'text': 'As a user, I want to manage my profile',
                            'points': 5,
                            'status': UserStory.Status.IN_PROGRESS,
                            'assignee': developer3,
                            'acceptance_tests': (
                                'Must edit personal info\n'
                                'Must change password'
                            ),
                            'business_value': 100
                        }
                    ]

                    for story_data in current_stories:
                        if not UserStory.objects.filter(
                            name=story_data['name']
                        ).exists():
                            story = UserStory.objects.create(
                                name=story_data['name'],
                                text=story_data['text'],
                                story_points=story_data['points'],
                                status=story_data['status'],
                                project=project1,
                                sprint=current_sprint,
                                created_by=product_owner,
                                assigned_to=story_data['assignee'],
                                acceptance_tests=story_data['acceptance_tests'],
                                business_value=story_data['business_value']
                            )
                            self.stdout.write(
                                self.style.SUCCESS(
                                    'Created current sprint story: '
                                    f'{story.name}'
                                )
                            )

                # Stories for future sprint
                if future_sprint:
                    future_stories = [
                        {
                            'name': 'Reporting Dashboard',
                            'text': (
                                'As a product owner, I want to see reports'
                            ),
                            'points': 21,
                            'status': UserStory.Status.NOT_STARTED,
                            'assignee': None,
                            'acceptance_tests': (
                                'Must show burndown chart\n'
                                'Must display velocity'
                            ),
                            'business_value': 500
                        },
                        {
                            'name': 'Team Collaboration',
                            'text': (
                                'As a team member, I want to collaborate'
                            ),
                            'points': 13,
                            'status': UserStory.Status.NOT_STARTED,
                            'assignee': None,
                            'acceptance_tests': (
                                'Must support comments\n'
                                'Must notify team members'
                            ),
                            'business_value': 300
                        }
                    ]

                    for story_data in future_stories:
                        if not UserStory.objects.filter(
                            name=story_data['name']
                        ).exists():
                            story = UserStory.objects.create(
                                name=story_data['name'],
                                text=story_data['text'],
                                story_points=story_data['points'],
                                status=story_data['status'],
                                project=project1,
                                sprint=future_sprint,
                                created_by=product_owner,
                                assigned_to=story_data['assignee'],
                                acceptance_tests=story_data['acceptance_tests'],
                                business_value=story_data['business_value']
                            )
                            self.stdout.write(
                                self.style.SUCCESS(
                                    'Created future sprint story: '
                                    f'{story.name}'
                                )
                            )

                # Create tasks for all stories
                all_stories = UserStory.objects.filter(project=project1)
                for story in all_stories:
                    try:
                        if story.name == 'Backlog Story 1':
                            tasks = [
                                {
                                    'title': 'Backlog List View',
                                    'description': 'Create view for backlog items',
                                    'estimated_hours': Decimal('6.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                },
                                {
                                    'title': 'Backlog Sorting',
                                    'description': 'Implement sorting',
                                    'estimated_hours': Decimal('4.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                }
                            ]
                        elif story.name == 'Backlog Story 2':
                            tasks = [
                                {
                                    'title': 'Priority Management',
                                    'description': 'Implement priority system',
                                    'estimated_hours': Decimal('5.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                }
                            ]
                        elif story.name == 'User Authentication':
                            tasks = [
                                {
                                    'title': 'Login Form',
                                    'description': 'Create login form',
                                    'estimated_hours': Decimal('4.0'),
                                    'status': Task.Status.COMPLETED,
                                    'assigned_to': developer
                                },
                                {
                                    'title': 'Authentication Logic',
                                    'description': 'Implement auth logic',
                                    'estimated_hours': Decimal('6.0'),
                                    'status': Task.Status.COMPLETED,
                                    'assigned_to': developer
                                }
                            ]
                        elif story.name == 'Dashboard View':
                            tasks = [
                                {
                                    'title': 'Dashboard Layout',
                                    'description': 'Create dashboard layout',
                                    'estimated_hours': Decimal('5.0'),
                                    'status': Task.Status.COMPLETED,
                                    'assigned_to': developer2
                                },
                                {
                                    'title': 'Activity Feed',
                                    'description': 'Implement activity feed',
                                    'estimated_hours': Decimal('4.0'),
                                    'status': Task.Status.COMPLETED,
                                    'assigned_to': developer2
                                }
                            ]
                        elif story.name == 'Task Management':
                            tasks = [
                                {
                                    'title': 'Create Task Form',
                                    'description': 'Implement form for tasks',
                                    'estimated_hours': Decimal('8.0'),
                                    'status': Task.Status.IN_PROGRESS,
                                    'assigned_to': developer
                                },
                                {
                                    'title': 'Task List View',
                                    'description': 'Create view for tasks',
                                    'estimated_hours': Decimal('5.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': developer2
                                }
                            ]
                        elif story.name == 'Sprint Planning':
                            tasks = [
                                {
                                    'title': 'Sprint Creation',
                                    'description': 'Implement sprint creation',
                                    'estimated_hours': Decimal('6.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': developer2
                                },
                                {
                                    'title': 'Sprint Planning View',
                                    'description': 'Create planning view',
                                    'estimated_hours': Decimal('4.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': developer2
                                }
                            ]
                        elif story.name == 'User Profile':
                            tasks = [
                                {
                                    'title': 'Profile Edit Form',
                                    'description': 'Create edit form',
                                    'estimated_hours': Decimal('4.0'),
                                    'status': Task.Status.IN_PROGRESS,
                                    'assigned_to': developer3
                                },
                                {
                                    'title': 'Profile View',
                                    'description': 'Create profile view',
                                    'estimated_hours': Decimal('3.0'),
                                    'status': Task.Status.COMPLETED,
                                    'assigned_to': developer3
                                }
                            ]
                        elif story.name == 'Reporting Dashboard':
                            tasks = [
                                {
                                    'title': 'Burndown Chart',
                                    'description': 'Implement burndown chart',
                                    'estimated_hours': Decimal('8.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                },
                                {
                                    'title': 'Velocity Tracking',
                                    'description': 'Implement velocity tracking',
                                    'estimated_hours': Decimal('6.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                }
                            ]
                        elif story.name == 'Team Collaboration':
                            tasks = [
                                {
                                    'title': 'Comment System',
                                    'description': 'Implement comment system',
                                    'estimated_hours': Decimal('5.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                },
                                {
                                    'title': 'Notification System',
                                    'description': 'Implement notifications',
                                    'estimated_hours': Decimal('6.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                }
                            ]
                        else:
                            # Generic tasks for any story that doesn't have specific tasks
                            tasks = [
                                {
                                    'title': f'Analysis for {story.name}',
                                    'description': f'Analyze requirements for {story.name}',
                                    'estimated_hours': Decimal('3.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                },
                                {
                                    'title': f'Implementation for {story.name}',
                                    'description': f'Implement {story.name}',
                                    'estimated_hours': Decimal('8.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                },
                                {
                                    'title': f'Testing for {story.name}',
                                    'description': f'Test {story.name}',
                                    'estimated_hours': Decimal('4.0'),
                                    'status': Task.Status.UNASSIGNED,
                                    'assigned_to': None
                                }
                            ]

                        for task_data in tasks:
                            if not Task.objects.filter(
                                title=task_data['title'], story=story
                            ).exists():
                                task = Task.objects.create(
                                    title=task_data['title'],
                                    description=task_data['description'],
                                    estimated_hours=task_data['estimated_hours'],
                                    remaining_hours=task_data['estimated_hours'],
                                    status=task_data['status'],
                                    story=story,
                                    assigned_to=task_data['assigned_to'],
                                    created_by=product_owner
                                )
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        f'Created task: {task.title}'
                                    )
                                )

                                # Add time logs for tasks in progress or completed
                                if task.status in [
                                    Task.Status.IN_PROGRESS,
                                    Task.Status.COMPLETED
                                ]:
                                    hours_spent = Decimal('2.0')
                                    TimeLog.objects.create(
                                        task=task,
                                        user=task.assigned_to,
                                        hours_spent=hours_spent,
                                        date=today - datetime.timedelta(days=1),
                                        description='Initial work on the task'
                                    )
                                    task.remaining_hours = (
                                        task.estimated_hours - hours_spent
                                    )
                                    task.save()
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Error creating tasks for story {story.name}: '
                                f'{str(e)}'
                            )
                        )
                        continue

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f'Error creating data: {str(e)}'
                    )
                )

        # Restore original save method
        Sprint.save = original_save

        self.stdout.write(
            self.style.SUCCESS('Initial data creation complete!')
        )
