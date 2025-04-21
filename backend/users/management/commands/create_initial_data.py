from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from projects.models import Project, ProjectMember
from sprints.models import Sprint
from stories.models import UserStory
from tasks.models import Task, TimeLog
import datetime
from decimal import Decimal
import traceback

User = get_user_model()


class Command(BaseCommand):
    help = (
        'Creates initial users and data for testing the application'
    )

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating initial data...')

        original_save = Sprint.save

        def bypass_validation_save(instance, *args, **kwargs):
            should_skip = getattr(instance, '_skip_validation', False)
            if should_skip:
                # Temporarily remove the flag before saving via base manager
                delattr(instance, '_skip_validation')
                # Use _base_manager to bypass model validation
                Sprint._base_manager.save(instance, *args, **kwargs)
                # Re-add flag for potential future saves
                setattr(instance, '_skip_validation', True)
            else:
                original_save(instance, *args, **kwargs)

        Sprint.save = bypass_validation_save

        try:
            with transaction.atomic():
                # --- Create Users ---
                if not User.objects.filter(username__iexact='admin').exists():
                    admin_user = User.objects.create_superuser(
                        username='admin', email='admin@example.com',
                        password='admin123', user_type=User.UserType.ADMIN
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f'Admin user created: {admin_user.username}'
                    ))
                else:
                    self.stdout.write(self.style.SUCCESS(
                        'Admin user already exists'
                    ))

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
                        User.objects.create_user(
                            username=username,
                            email=f'{username}@example.com',
                            password='password123',
                            user_type=User.UserType.USER,
                            first_name=username.capitalize().split('_')[0],
                            last_name=(username.capitalize().split('_')[-1]
                                       if '_' in username else '')
                        )
                        self.stdout.write(self.style.SUCCESS(
                            f'User created: {username}'
                        ))
                    else:
                        self.stdout.write(self.style.SUCCESS(
                            f'User {username} already exists'
                        ))

                if not User.objects.filter(username__iexact='non_member').exists():
                    User.objects.create_user(
                        username='non_member',
                        email='non_member@example.com',
                        password='password123',
                        user_type=User.UserType.USER,
                        first_name='Non', last_name='Member'
                    )
                    self.stdout.write(self.style.SUCCESS(
                        'User created: non_member'
                    ))

                # --- Fetch Required User Objects ---
                try:
                    product_owner_user = User.objects.get(username='product_owner')
                    scrum_master_user = User.objects.get(username='scrum_master')
                    developer_user = User.objects.get(username='developer')
                    developer2_user = User.objects.get(username='developer2')
                    developer3_user = User.objects.get(username='developer3')
                    developer4_user = User.objects.get(username='developer4')
                    developer5_user = User.objects.get(username='developer5')
                    developer6_user = User.objects.get(username='developer6')
                    p1_devs = [
                        developer_user, developer2_user, developer3_user,
                        developer4_user, developer5_user, developer6_user
                    ]
                    p2_devs = [
                        developer2_user, developer3_user, developer4_user
                    ]
                except User.DoesNotExist as e:
                    self.stdout.write(self.style.ERROR(
                        f'Required user not found: {e}')
                    )
                    raise

                # --- Create Projects ---
                project1, _ = Project.objects.get_or_create(
                    name='Scrum Project 1',
                    defaults={ 'description': 'Desc 1', 'product_owner': product_owner_user, 'scrum_master': scrum_master_user }
                )
                project2, _ = Project.objects.get_or_create(
                    name='Scrum Project 2',
                    defaults={ 'description': 'Desc 2', 'product_owner': product_owner_user, 'scrum_master': scrum_master_user }
                )

                # Create project memberships
                # Project 1 memberships
                ProjectMember.objects.get_or_create(
                    project=project1,
                    user=product_owner_user,
                    defaults={'role': ProjectMember.Role.PRODUCT_OWNER}
                )
                ProjectMember.objects.get_or_create(
                    project=project1,
                    user=scrum_master_user,
                    defaults={'role': ProjectMember.Role.SCRUM_MASTER}
                )

                # Add developers to Project 1
                for dev in p1_devs:
                    ProjectMember.objects.get_or_create(
                        project=project1,
                        user=dev,
                        defaults={'role': ProjectMember.Role.DEVELOPER}
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f'Added {dev.username} to {project1.name} as Developer'
                    ))

                # Project 2 memberships
                ProjectMember.objects.get_or_create(
                    project=project2,
                    user=product_owner_user,
                    defaults={'role': ProjectMember.Role.PRODUCT_OWNER}
                )
                ProjectMember.objects.get_or_create(
                    project=project2,
                    user=scrum_master_user,
                    defaults={'role': ProjectMember.Role.SCRUM_MASTER}
                )

                # Add developers to Project 2
                for dev in p2_devs:
                    ProjectMember.objects.get_or_create(
                        project=project2,
                        user=dev,
                        defaults={'role': ProjectMember.Role.DEVELOPER}
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f'Added {dev.username} to {project2.name} as Developer'
                    ))

                # --- Create Sprints ---
                today = datetime.date.today()

                def get_weekday_date(base_date):
                    while base_date.weekday() >= 5: # Mon=0, Sun=6
                        base_date += datetime.timedelta(days=1)
                    return base_date

                def create_or_get_sprint(proj, start, end, vel, completed=False):
                    try:
                        sprint = Sprint.objects.get(
                            project=proj, start_date=start
                        )
                        log_msg = 'already exists'
                    except Sprint.DoesNotExist:
                        sprint = Sprint(
                            project=proj,
                            start_date=start,
                            end_date=end,
                            velocity=vel,
                            is_completed=completed,
                            created_by=scrum_master_user
                        )
                        Sprint.objects.bulk_create([sprint])
                        log_msg = 'created'

                    self.stdout.write(self.style.SUCCESS(
                        f'Sprint {log_msg} for {proj.name} ({start})'
                    ))
                    return sprint

                # P1 Sprints
                past_start_p1 = get_weekday_date(today - datetime.timedelta(30))
                past_end_p1 = get_weekday_date(past_start_p1 + datetime.timedelta(14))
                past_sprint_p1 = create_or_get_sprint(
                    project1, past_start_p1, past_end_p1, 20, completed=True
                )
                current_start_p1 = get_weekday_date(today - datetime.timedelta(7))
                current_end_p1 = get_weekday_date(current_start_p1 + datetime.timedelta(14))
                current_sprint_p1 = create_or_get_sprint(
                    project1, current_start_p1, current_end_p1, 15
                )
                future_start_p1 = get_weekday_date(today + datetime.timedelta(14))
                future_end_p1 = get_weekday_date(future_start_p1 + datetime.timedelta(14))
                future_sprint_p1 = create_or_get_sprint(
                    project1, future_start_p1, future_end_p1, 18
                )
                # P2 Sprint
                current_start_p2 = current_start_p1
                current_end_p2 = current_end_p1
                project2_sprint = create_or_get_sprint(
                    project2, current_start_p2, current_end_p2, 12
                )

                # --- User Story and Task Creation ---
                p1_dev1, p1_dev2, p1_dev3 = p1_devs[0], p1_devs[1], p1_devs[2]
                p2_dev1, p2_dev2, p2_dev3 = p2_devs[0], p2_devs[1], p2_devs[2]

                # --- Story Data Definitions ---
                stories_data = {
                    project1: {
                        None: [ # Backlog
                            {'name': 'BkSt 1 (P1)', 'text': 'See bk items',
                             'points': 5, 'status': 'NOT_STARTED', 'assignee': None,
                             'bv': 100, 'tests': 'Show all\nSortable'},
                            {'name': 'BkSt 2 (P1)', 'text': 'Prioritize bk',
                             'points': 8, 'status': 'NOT_STARTED', 'assignee': None,
                             'bv': 200, 'tests': 'Drag/drop\nSave order'},
                        ],
                        past_sprint_p1: [
                            {'name': 'Auth (P1)', 'text': 'Auth user',
                             'points': 5, 'status': 'ACCEPTED', 'assignee': p1_dev1,
                             'bv': 300, 'tests': 'Login ok\nLogin fail'},
                            {'name': 'Dash (P1)', 'text': 'See dash',
                             'points': 8, 'status': 'ACCEPTED', 'assignee': p1_dev2,
                             'bv': 200, 'tests': 'Overview\nActivity'},
                        ],
                        current_sprint_p1: [
                            {'name': 'TaskMgmt (P1)', 'text': 'Manage tasks',
                             'points': 13, 'status': 'IN_PROGRESS', 'assignee': p1_dev1,
                             'bv': 300, 'tests': 'CRUD tasks\nTrack time'},
                            {'name': 'SprintPlan (P1)', 'text': 'Plan sprints',
                             'points': 8, 'status': 'IN_PROGRESS', 'assignee': p1_dev2,
                             'bv': 400, 'tests': 'Set dates\nAssign stories'},
                            {'name': 'Profile (P1)', 'text': 'Manage profile',
                             'points': 5, 'status': 'DONE', # Changed from SPRINT
                             'assignee': p1_dev3, 'bv': 100,
                             'tests': 'Edit info\nChange pass'},
                        ],
                        future_sprint_p1: [
                            {'name': 'Report (P1)', 'text': 'See reports',
                             'points': 21, 'status': 'NOT_STARTED', 'assignee': None,
                             'bv': 500, 'tests': 'Burndown\nVelocity'},
                            {'name': 'Collab (P1)', 'text': 'Collaborate',
                             'points': 13, 'status': 'NOT_STARTED', 'assignee': None,
                             'bv': 300, 'tests': 'Comments\nNotify'},
                        ]
                    },
                    project2: {
                        project2_sprint: [
                            {'name': 'Feat A (P2)', 'text': 'P2 needs A',
                             'points': 8, 'status': 'IN_PROGRESS', 'assignee': p2_dev1,
                             'bv': 250, 'tests': 'Do X\nDo Y'},
                            {'name': 'BugFix (P2)', 'text': 'Fix bug Z',
                             'points': 3, 'status': 'IN_PROGRESS', 'assignee': p2_dev2,
                             'bv': 150, 'tests': 'Verify Z\nRegress test'},
                        ]
                    }
                }

                # --- Create Stories Loop ---
                for proj, sprint_map in stories_data.items():
                    for sprint, stories in sprint_map.items():
                        sprint_type = 'Unknown' # Default sprint type log
                        if sprint is None and proj == project1:
                            sprint_type = 'P1 Backlog'
                        elif sprint is None: continue
                        elif proj == project1:
                            if sprint == past_sprint_p1: sprint_type = 'P1 Past'
                            elif sprint == current_sprint_p1: sprint_type = 'P1 Current'
                            elif sprint == future_sprint_p1: sprint_type = 'P1 Future'
                        elif proj == project2 and sprint == project2_sprint:
                            sprint_type = 'P2 Current'

                        for story_data in stories:
                            story_name = story_data.get("name", "N/A")
                            try:
                                status_str = story_data['status']
                                # Corrected usage of getattr with UserStory.Status
                                status_enum = getattr(UserStory.Status, status_str)

                                story, created = UserStory.objects.get_or_create(
                                    project=proj, name=story_name,
                                    defaults={
                                        'sprint': sprint,
                                        'created_by': product_owner_user,
                                        'text': story_data['text'],
                                        'story_points': story_data['points'],
                                        'status': status_enum, # Use the enum member
                                        'assigned_to': story_data['assignee'],
                                        'acceptance_tests': story_data['tests'],
                                        'business_value': story_data['bv']
                                    }
                                )
                                if created:
                                    self.stdout.write(self.style.SUCCESS(
                                        f'Created {sprint_type} story: "{story_name}"'
                                    ))
                            except AttributeError:
                                msg = (f'Invalid STATUS "{status_str}" for story ' +
                                       f'"{story_name}". Check stories/models.py.')
                                self.stdout.write(self.style.WARNING(msg))
                            except Exception as story_exc:
                                msg = (f'Error creating/getting {sprint_type} ' +
                                       f'story "{story_name}": {str(story_exc)}')
                                self.stdout.write(self.style.WARNING(msg))
                                traceback.print_exc()

                # --- Task Data Definitions ---
                tasks_data = {
                    'BkSt 1 (P1)': [
                        {'title': 'P1 BkList', 'desc': 'View', 'hours': 6.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                        {'title': 'P1 BkSort', 'desc': 'Sort', 'hours': 4.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                    ],
                    'BkSt 2 (P1)': [
                        {'title': 'P1 Priority', 'desc': 'Priority', 'hours': 5.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                    ],
                    'Auth (P1)': [
                        {'title': 'P1 Login Form', 'desc': 'UI', 'hours': 4.0,
                         'status': 'COMPLETED', 'assignee': p1_dev1},
                        {'title': 'P1 Auth Logic', 'desc': 'Backend', 'hours': 6.0,
                         'status': 'COMPLETED', 'assignee': p1_dev1},
                    ],
                    'Dash (P1)': [
                        {'title': 'P1 Layout', 'desc': 'Layout', 'hours': 5.0,
                         'status': 'COMPLETED', 'assignee': p1_dev2},
                        {'title': 'P1 Feed', 'desc': 'Feed', 'hours': 4.0,
                         'status': 'COMPLETED', 'assignee': p1_dev2},
                    ],
                    'TaskMgmt (P1)': [
                        {'title': 'P1 Task Form', 'desc': 'Form', 'hours': 8.0,
                         'status': 'IN_PROGRESS', 'assignee': p1_dev1},
                        {'title': 'P1 Task List', 'desc': 'List', 'hours': 5.0,
                         'status': 'ASSIGNED', 'assignee': p1_dev2},
                    ],
                    'SprintPlan (P1)': [
                        {'title': 'P1 Sprint Logic', 'desc': 'BE', 'hours': 6.0,
                         'status': 'ASSIGNED', 'assignee': p2_dev2},
                        {'title': 'P1 Sprint UI', 'desc': 'UI', 'hours': 4.0,
                         'status': 'ASSIGNED', 'assignee': p2_dev2},
                    ],
                    'Profile (P1)': [
                        {'title': 'P1 Profile Form', 'desc': 'UI', 'hours': 4.0,
                         'status': 'IN_PROGRESS', 'assignee': p1_dev3},
                        {'title': 'P1 Profile View', 'desc': 'Display', 'hours': 3.0,
                         'status': 'COMPLETED', 'assignee': p1_dev3},
                    ],
                    'Report (P1)': [
                        {'title': 'P1 Burndown', 'desc': 'Chart', 'hours': 8.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                        {'title': 'P1 Velocity', 'desc': 'Calc', 'hours': 6.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                    ],
                    'Collab (P1)': [
                        {'title': 'P1 Comment BE', 'desc': 'Comments', 'hours': 5.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                        {'title': 'P1 Notify Svc', 'desc': 'Notify', 'hours': 6.0,
                         'status': 'UNASSIGNED', 'assignee': None},
                    ],
                    'Feat A (P2)': [
                        {'title': 'P2 FeatA Logic', 'desc': 'Logic', 'hours': 5.0,
                         'status': 'IN_PROGRESS', 'assignee': p2_dev1},
                        {'title': 'P2 FeatA UI', 'desc': 'UI', 'hours': 3.0,
                         'status': 'UNASSIGNED', 'assignee': p2_dev2},
                    ],
                    'BugFix (P2)': [
                        {'title': 'P2 Bug Z', 'desc': 'Fix', 'hours': 2.0,
                         'status': 'UNASSIGNED', 'assignee': p2_dev2},
                        {'title': 'P2 Regress Z', 'desc': 'Test', 'hours': 1.0,
                         'status': 'UNASSIGNED', 'assignee': p2_dev3},
                    ]
                }

                # --- Create Tasks Loop ---
                all_stories = UserStory.objects.all()
                for story in all_stories:
                    if story.name not in tasks_data: continue

                    for task_data in tasks_data[story.name]:
                        task_title = task_data.get("title", "N/A")
                        try:
                            task_status_str = task_data['status']
                            # Corrected usage of getattr with Task.Status
                            task_status_enum = getattr(Task.Status, task_status_str)
                            task_hours = Decimal(str(task_data['hours']))

                            task, created = Task.objects.get_or_create(
                                story=story, title=task_title,
                                defaults={
                                    'created_by': product_owner_user,
                                    'description': task_data['desc'],
                                    'estimated_hours': task_hours,
                                    'remaining_hours': task_hours,
                                    'status': task_status_enum, # Use the enum member
                                    'assigned_to': task_data['assignee'],
                                }
                            )

                            if created:
                                self.stdout.write(self.style.SUCCESS(
                                    f'Created task: "{task_title}" for "{story.name}"'
                                ))

                            # Add TimeLog if applicable
                            if (created and task.assigned_to and task.status in
                                    [Task.Status.IN_PROGRESS, Task.Status.COMPLETED]):
                                hours_spent = Decimal('2.0')
                                if task.status == Task.Status.COMPLETED:
                                    actual_hours_spent = task.estimated_hours
                                    log_desc = 'Completed the task'
                                    task.remaining_hours = Decimal('0.0')
                                else:
                                    actual_hours_spent = min(hours_spent, task.estimated_hours)
                                    log_desc = 'Initial work'
                                    task.remaining_hours = task.estimated_hours - actual_hours_spent

                                task.remaining_hours = max(Decimal('0.0'), task.remaining_hours)

                                TimeLog.objects.create(
                                    task=task, user=task.assigned_to,
                                    hours_spent=actual_hours_spent,
                                    date=today - datetime.timedelta(days=1),
                                    description=log_desc
                                )
                                task.save()

                        except AttributeError:
                            msg = (f'Invalid TASK status "{task_status_str}" for task ' +
                                   f'"{task_title}". Check tasks/models.py.')
                            self.stdout.write(self.style.WARNING(msg))
                        except Exception as task_exc:
                            msg = (f'Error creating/getting task "{task_title}" ' +
                                   f'for story "{story.name}": {str(task_exc)}')
                            self.stdout.write(self.style.WARNING(msg))
                            traceback.print_exc()
                    # End of inner task creation loop
                # End of story loop

        except Exception as outer_exc:
            self.stdout.write(self.style.ERROR(
                f'Major error during data creation: {str(outer_exc)}'
            ))
            traceback.print_exc()

        # Restore original save method outside the transaction
        finally:
            Sprint.save = original_save

        self.stdout.write(
            self.style.SUCCESS('Initial data creation complete!')
        )
