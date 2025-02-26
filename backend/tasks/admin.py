from django.contrib import admin
from .models import Task, TimeLog

class TimeLogInline(admin.TabularInline):
    model = TimeLog
    extra = 1

class TaskAdmin(admin.ModelAdmin):
    list_display = ('description', 'story', 'status', 'assigned_to', 'estimated_hours', 'remaining_hours')
    list_filter = ('status', 'assigned_to')
    search_fields = ('description',)
    inlines = [TimeLogInline]

admin.site.register(Task, TaskAdmin) 