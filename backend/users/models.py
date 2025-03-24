from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class User(AbstractUser):
    """Custom user model to support admin/user distinction"""

    class UserType(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        USER = 'USER', _('User')

    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.USER,
    )
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_timestamp = models.DateTimeField(null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    @property
    def is_admin(self):
        return self.user_type == self.UserType.ADMIN

    @property
    def is_user(self):
        return self.user_type == self.UserType.USER

    def record_login(self, ip_address=None):
        """Record successful login information"""
        self.last_login_timestamp = timezone.now()
        self.last_login_ip = ip_address
        self.failed_login_attempts = 0
        self.save(update_fields=['last_login_timestamp', 'last_login_ip', 'failed_login_attempts'])

    def record_failed_login(self):
        """Record failed login attempt"""
        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()
        self.save(update_fields=['failed_login_attempts', 'last_failed_login'])
