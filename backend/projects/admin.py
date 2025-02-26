from django.contrib import admin
from .models import Project, ProjectMember, ProjectWallPost, ProjectWallComment, ProjectDocument

class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1

class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    inlines = [ProjectMemberInline]

class ProjectWallCommentInline(admin.TabularInline):
    model = ProjectWallComment
    extra = 1

class ProjectWallPostAdmin(admin.ModelAdmin):
    list_display = ('project', 'author', 'created_at')
    list_filter = ('project',)
    search_fields = ('content',)
    inlines = [ProjectWallCommentInline]

class ProjectDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'author', 'created_at')
    list_filter = ('project',)
    search_fields = ('title', 'content')

admin.site.register(Project, ProjectAdmin)
admin.site.register(ProjectWallPost, ProjectWallPostAdmin)
admin.site.register(ProjectDocument, ProjectDocumentAdmin) 