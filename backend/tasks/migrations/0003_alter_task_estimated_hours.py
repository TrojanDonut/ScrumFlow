# Generated by Django 4.2.7 on 2025-03-15 21:15

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_task_title'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='estimated_hours',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0.0)]),
        ),
    ]
