# Generated by Django 4.2.7 on 2025-04-07 08:08

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_alter_project_product_owner_and_more'),
        ('sprints', '0002_alter_sprint_project'),
        ('stories', '0005_alter_userstory_unique_together_userstory_project'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='userstory',
            unique_together={('project', 'name'), ('sprint', 'name')},
        ),
    ]
