from django.contrib import admin
from .models import Sprint

class SprintAdmin(admin.ModelAdmin):
    list_display = ('project', 'start_date', 'end_date', 'velocity', 'is_active')
    list_filter = ('project', 'start_date', 'end_date')
    search_fields = ('project__name',)
    date_hierarchy = 'start_date'

admin.site.register(Sprint, SprintAdmin) 