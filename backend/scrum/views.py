from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Project, UserStory
from django.contrib.auth.decorators import login_required

@login_required
def project_backlog(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    # Get all user stories for the project
    user_stories = UserStory.objects.filter(project=project)
    
    # Categorize user stories
    realized_stories = user_stories.filter(is_realized=True)
    unrealized_stories = user_stories.filter(is_realized=False)
    
    # Further categorize unrealized stories
    active_stories = unrealized_stories.filter(sprint__is_active=True)
    unactive_stories = unrealized_stories.filter(sprint__isnull=True) | unrealized_stories.filter(sprint__is_active=False)
    
    context = {
        'project': project,
        'realized_stories': realized_stories,
        'active_stories': active_stories,
        'unactive_stories': unactive_stories,
    }
    
    return render(request, 'scrum/backlog.html', context)

@login_required
def get_backlog_data(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    # Get all user stories for the project
    user_stories = UserStory.objects.filter(project=project)
    
    # Categorize user stories
    realized_stories = list(user_stories.filter(is_realized=True).values())
    unrealized_stories = user_stories.filter(is_realized=False)
    
    # Further categorize unrealized stories
    active_stories = list(unrealized_stories.filter(sprint__is_active=True).values())
    unactive_stories = list((unrealized_stories.filter(sprint__isnull=True) | 
                           unrealized_stories.filter(sprint__is_active=False)).values())
    
    return JsonResponse({
        'realized_stories': realized_stories,
        'active_stories': active_stories,
        'unactive_stories': unactive_stories,
    }) 