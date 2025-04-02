from django.contrib import admin
from .models import UserStory, UserStoryComment

class UserStoryCommentInline(admin.TabularInline):
    model = UserStoryComment
    extra = 1

class UserStoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'sprint', 'priority', 'status', 'business_value', 'story_points')
    list_filter = ('sprint', 'priority', 'status')
    search_fields = ('title', 'description')
    inlines = [UserStoryCommentInline]

admin.site.register(UserStory, UserStoryAdmin)
