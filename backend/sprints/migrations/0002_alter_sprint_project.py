# Generated by Django 5.1.7 on 2025-03-22 11:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
        ('sprints', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sprint',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.project'),
        ),
    ]
