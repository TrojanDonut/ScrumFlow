# Generated by Django 4.2.7 on 2025-04-11 22:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stories', '0007_userstory_assigned_to'),
    ]

    operations = [
        migrations.AddField(
            model_name='userstory',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
